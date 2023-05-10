pub mod db;

use concordium::{
    base as concordium_base,
    base::{
        contracts_common::{self as concordium_std, AccountAddress, Amount},
        smart_contracts::{OwnedParameter, OwnedReceiveName},
    },
    common::{self, Versioned},
    id::{
        constants::{ArCurve, AttributeKind},
        id_proof_types::Proof,
    },
    smart_contracts,
    types::{smart_contracts::ContractContext, CredentialRegistrationID, Energy, RejectReason},
    v2::BlockIdentifier,
};
use concordium_rust_sdk as concordium;
use concordium_rust_sdk::{cis2::TokenId, types::ContractAddress, v2};
use regex::Regex;
use std::collections::HashMap;

pub struct ContractClient {
    pub address: ContractAddress,
    pub client:  v2::Client,
}

pub type ProofId = u64;

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MintParams {
    pub account:  AccountAddress,
    pub platform: SupportedPlatform,
    #[serde(flatten)]
    pub private:  PrivateTokenData,
}

#[derive(serde::Deserialize, common::Serialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivateTokenData {
    pub first_name: AttributeKind,
    #[serde(rename = "surName")]
    pub surname:    AttributeKind,
    #[string_size_length = 4]
    pub user_data:  String,
    pub challenge:  Challenge,
    pub proof:      ProofWithContext,
}

#[derive(serde::Deserialize, Debug, Clone, common::Serialize, serde::Serialize)]
pub struct ProofWithContext {
    pub credential: CredentialRegistrationID,
    pub proof:      Versioned<Proof<ArCurve, AttributeKind>>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Copy, common::Serialize)]
#[serde(into = "String", try_from = "String")]
pub struct Challenge {
    pub challenge: [u8; 32],
}

impl From<Challenge> for String {
    fn from(value: Challenge) -> Self { hex::encode(value.challenge) }
}

impl TryFrom<String> for Challenge {
    type Error = anyhow::Error;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        anyhow::ensure!(
            value.len() == 64,
            "Incorrect challenge length. Expected 64 hex characters."
        );
        let bytes = hex::decode(value)?;
        let challenge = bytes
            .try_into()
            .map_err(|_| anyhow::anyhow!("Incorrect challenge length."))?;
        Ok(Self { challenge })
    }
}

/// The return type for the contract function `viewData`.
#[derive(concordium_std::Deserial)]
pub struct ViewData {
    /// Owner of the token.
    pub owner:    AccountAddress,
    /// Whether the token is revoked or not.
    pub revoked:  bool,
    /// Platform associated with the token.
    pub platform: SupportedPlatform,
    /// The data, which includes the proof, challenge, name, social media URL
    /// (e.g linkedin URL).
    #[concordium(size_length = 2)]
    pub data:     Vec<u8>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize, Eq, PartialEq)]
#[repr(u32)]
pub enum SupportedPlatform {
    #[serde(rename = "li")]
    LinkedIn,
}

impl smart_contracts::common::Serial for SupportedPlatform {
    fn serial<W: smart_contracts::common::Write>(&self, out: &mut W) -> Result<(), W::Err> {
        out.write_all(b"li")
    }
}

impl smart_contracts::common::Deserial for SupportedPlatform {
    fn deserial<R: smart_contracts::common::Read>(
        source: &mut R,
    ) -> smart_contracts::common::ParseResult<Self> {
        let data: [u8; 2] = <[u8; 2]>::deserial(source)?;
        if &data == b"li" {
            Ok(Self::LinkedIn)
        } else {
            Err(smart_contracts::common::ParseError {})
        }
    }
}

impl std::fmt::Display for SupportedPlatform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SupportedPlatform::LinkedIn => f.write_str("li"),
        }
    }
}

#[derive(thiserror::Error, Debug)]
pub enum ContractQueryError {
    #[error("Error querying the node: {0}")]
    Network(#[from] v2::QueryError),
    #[error("The invoke method failed: {0:?}")]
    InvokeFailure(RejectReason),
    #[error("Could not parse response.")]
    ParseResponseFailure,
}

impl ContractClient {
    // Get the token data from the last finalized block.
    pub async fn view_token_data(
        &mut self,
        id: &ProofId,
    ) -> Result<Option<ViewData>, ContractQueryError> {
        let context = ContractContext {
            invoker:   None,
            contract:  self.address,
            amount:    Amount::zero(),
            method:    OwnedReceiveName::new_unchecked("mysomeid.viewData".into()),
            parameter: OwnedParameter::from_serial(&TokenId::new_unchecked(
                id.to_le_bytes().to_vec(),
            ))
            .expect("8 bytes fits."),
            energy:    Energy::from(100_000),
        };
        let response = self
            .client
            .invoke_instance(BlockIdentifier::LastFinal, &context)
            .await?
            .response;
        match response {
            concordium::types::smart_contracts::InvokeContractResult::Success {
                return_value,
                ..
            } => match return_value {
                Some(rv) => smart_contracts::common::from_bytes(&rv.value)
                    .map_err(|_| ContractQueryError::ParseResponseFailure),
                None => Ok(None),
            },
            concordium::types::smart_contracts::InvokeContractResult::Failure {
                reason, ..
            } => Err(ContractQueryError::InvokeFailure(reason)),
        }
    }
}

/// Test whether the two names `a` and `b` match, where the case  and trailing
/// whitespaces are ignored and some characters may be substituted.
/// Substitutions are not applied recursively. E.g., if a -> aa is an allowed
/// substitution, Dan can become Daan, but not Daaan. Furthermore, substitutions
/// are only applied either from `a` to `b` or vice versa, but not in both
/// directions. E.g., Jóhn Doe matches John Doe, but not John Doé. This avoids
/// rules such as å -> (aa or a) to be misused to obtain Dan -> Dån -> Daan ->
/// Dåån -> Daaaan.
///
/// Arguments:
/// - `a1` - first name of `a`.
/// - `a2` - last name of `a`.
/// - `b1` - first name of `b`.
/// - `b2` - last name of `b`.
/// - `allowed_substitutions` - map containing for each substitutable character
///   `c` a vector of strings with which `c` can be replaced. Only lowercase
///   characters need to be considered and the strings in the vectors must all
///   be lowercase.
pub fn fuzzy_match_names(
    a1: &str,
    a2: &str,
    b1: &str,
    b2: &str,
    allowed_substitutions: &HashMap<char, Vec<String>>,
) -> Result<bool, regex::Error> {
    // first test simplest case of exact match
    if a1 == b1 && a2 == b2 {
        return Ok(true);
    }
    // next remove trailing whitespaces, convert to lower case, and concatenate into
    // full name
    let a1_trimmed = a1.trim();
    let a2_trimmed = a2.trim();
    let b1_trimmed = b1.trim();
    let b2_trimmed = b2.trim();
    let a = format!("{a1_trimmed} {a2_trimmed}").to_lowercase();
    let b = format!("{b1_trimmed} {b2_trimmed}").to_lowercase();
    if a == b {
        return Ok(true);
    }
    find_inclusion(a.as_str(), b.as_str(), allowed_substitutions)
}

fn find_inclusion(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<char, Vec<String>>,
) -> Result<bool, regex::Error> {
    let wa = a.split(' ');
    let mut wb = b.split(' ');
    let mut count = 0;
    for a_word in wa {
        if !a_word.trim().is_empty() {
            count += 1;
            let mut found = false;
            for b_word in wb.by_ref() {
                if can_transform_string(a_word, b_word, allowed_substitutions)? {
                    found = true;
                    break;
                }
            }
            if !found {
                return Ok(false);
            }
        }
    }
    Ok(count >= 2)
}

/// Test whether the string `a` can be transformed into `b` using
/// `allowed_substitutions`.
fn can_transform_string(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<char, Vec<String>>,
) -> Result<bool, regex::Error> {
    // construct regular expression from `a` replacing all characters that can be
    // substituted by `s1` or `s2` or ... or `sn` by `(s1|...|sn)`
    let mut a_regex_string = "^".to_string();
    for c in a.chars() {
        // escape all regular expression characters
        let c_escaped = regex::escape(&format!("{c}"));
        match allowed_substitutions.get(&c) {
            Some(sub) => {
                // If substitution exists, replace character by regex with allowed alternatives
                let mut sub_exp = "(".to_string();
                // include character itself, to allow not replacing it.
                sub_exp += &c_escaped;
                for s in sub {
                    sub_exp.push('|');
                    // also escape characters in substituted string
                    sub_exp += &regex::escape(s);
                }
                sub_exp.push(')');
                a_regex_string += &sub_exp;
            }
            // If no substitution for `c` exists, append escaped `c`
            None => a_regex_string += &c_escaped,
        }
    }
    a_regex_string += "$";
    // test whether b matches the constructed regular expression
    let a_regex = Regex::new(&a_regex_string)?;
    // note: it is fine for `b` to be untrusted according to regex documentation
    Ok(a_regex.is_match(b))
}

/// Returns a map with default allowed substitutions.
pub fn get_allowed_substitutions() -> HashMap<char, Vec<String>> {
    HashMap::from([
        // Danish
        ('å', ["aa", "a"].iter().map(|s| s.to_string()).collect()),
        ('æ', ["ae"].iter().map(|s| s.to_string()).collect()),
        ('ø', ["oe", "o"].iter().map(|s| s.to_string()).collect()),
        // German
        ('ä', ["ae", "a"].iter().map(|s| s.to_string()).collect()),
        ('ü', ["ue", "u"].iter().map(|s| s.to_string()).collect()),
        ('ö', ["oe", "o"].iter().map(|s| s.to_string()).collect()),
        ('ß', ["ss", "s"].iter().map(|s| s.to_string()).collect()),
        // French
        ('ç', ["c"].iter().map(|s| s.to_string()).collect()),
        ('é', ["e"].iter().map(|s| s.to_string()).collect()),
        ('à', ["a"].iter().map(|s| s.to_string()).collect()),
        ('è', ["e"].iter().map(|s| s.to_string()).collect()),
        ('ì', ["i"].iter().map(|s| s.to_string()).collect()),
        ('ò', ["o"].iter().map(|s| s.to_string()).collect()),
        ('ù', ["u"].iter().map(|s| s.to_string()).collect()),
        ('â', ["a"].iter().map(|s| s.to_string()).collect()),
        ('ê', ["e"].iter().map(|s| s.to_string()).collect()),
        ('î', ["i"].iter().map(|s| s.to_string()).collect()),
        ('ô', ["o"].iter().map(|s| s.to_string()).collect()),
        ('û', ["u"].iter().map(|s| s.to_string()).collect()),
        ('ë', ["e"].iter().map(|s| s.to_string()).collect()),
        ('ï', ["i"].iter().map(|s| s.to_string()).collect()),
        ('œ', ["oe"].iter().map(|s| s.to_string()).collect()),
        // Slovenian
        ('č', ["c"].iter().map(|s| s.to_string()).collect()),
        ('š', ["s"].iter().map(|s| s.to_string()).collect()),
        ('ž', ["z"].iter().map(|s| s.to_string()).collect()),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_test_allowed_substitutions() -> HashMap<char, Vec<String>> {
        let mut allowed_substitutions = get_allowed_substitutions();
        // add extra substitution only for testing
        allowed_substitutions.insert('*', ["**"].iter().map(|s| s.to_string()).collect());
        allowed_substitutions
    }

    #[test]
    /// Test whether matching names are accepted
    fn test_matching_names() {
        let allowed_substitutions = get_test_allowed_substitutions();

        // test exact match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John Fitzgerald";
        let b2 = "Doe";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe Fitzgerald";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Fitzgerald Adams Doe The Third";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test different cases
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "JOHN";
        let b2 = "doE";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test trailing whitespaces
        let a1 = "John";
        let a2 = "Doe";
        let b1 = " John";
        let b2 = "Doe  ";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test exact match containing regular expression characters
        let a1 = "John";
        let a2 = "Doe (Jr.*)";
        let b1 = "John";
        let b2 = "Doe (Jr.*)";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test basic substitutions
        let a1 = "John";
        let a2 = "Dåe";
        let b1 = "John";
        let b2 = "Daae";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test basic substitutions with uppercase special characters
        let a1 = "JOHN";
        let a2 = "DÆE";
        let b1 = "John";
        let b2 = "Daee";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test substitution with regular expression characters
        let a1 = "Jöhn";
        let a2 = "Doé (Jr.*)";
        let b1 = "John";
        let b2 = "Doe (Jr.*)";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test substitution with regular expression characters also in substituted
        // string
        let a1 = "J*hn";
        let a2 = "Doé";
        let b1 = "J**hn";
        let b2 = "Doe";
        assert!(fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());
    }

    #[test]
    /// Test whether non matching names are rejected
    fn test_inclusion() -> anyhow::Result<()> {
        let allowed_substitutions = get_test_allowed_substitutions();
        assert!(find_inclusion(
            "foo bar",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(find_inclusion(
            "foo bar baz",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(find_inclusion(
            "foo bar baz",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(find_inclusion(
            "foo bar baz",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(find_inclusion(
            "foo bar baz",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        // Too short not allowed
        assert!(!find_inclusion(
            "foo",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        // Too short not allowed
        assert!(!find_inclusion(
            "",
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        Ok(())
    }

    #[test]
    /// Test whether non matching names are rejected
    fn test_non_matching_names() {
        let allowed_substitutions = get_test_allowed_substitutions();

        // different first names don't match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "James";
        let b2 = "Doe";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // at least two words must match
        let a1 = "John";
        let a2 = "";
        let b1 = "John";
        let b2 = "Doe Fitzgerald";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // duplicate names don't match
        let a1 = "John";
        let a2 = "John";
        let b1 = "John";
        let b2 = "Doe";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // different last names don't match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Smith";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // interchanging first and last name doesn't match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "Doe";
        let b2 = "John";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test that substitutions are only applied in one direction
        let a1 = "Jóhn";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doé";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test that regular expression character in name is not executed
        let a1 = "John";
        let a2 = "Do*e";
        let b1 = "John";
        let b2 = "Dooooe";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test that substitution is only applied once
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "J***hn";
        let b2 = "Doe";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test that the full name must match modulo substitutions
        let a1 = "Foo";
        let a2 = "Bar";
        let b1 = "oo";
        let b2 = "Bar";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());

        // test that the full name must match modulo substitutions
        let a1 = "Foo";
        let a2 = "Bar";
        let b1 = "";
        let b2 = "";
        assert!(!fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions).unwrap());
    }
}
