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
use std::collections::{BTreeMap, HashMap, HashSet};
use unicode_segmentation::UnicodeSegmentation;

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

/// Test whether the two names `a` and `b` match, with the following rules
///
/// - case and trailing whitespaces are ignored and some characters may be
///   substituted.
/// - the words in name a must be a subset of the words in name b, and there
///   must be at least two words in name a.
///
/// Character substitutions are not applied recursively. E.g., if a -> aa is an
/// allowed substitution, Dan can become Daan, but not Daaan. Furthermore,
/// substitutions are only applied either from `a` to `b` or vice versa, but not
/// in both directions. E.g., Jóhn Doe matches John Doe, but not John Doé. This
/// avoids rules such as å -> (aa or a) to be misused to obtain Dan -> Dån ->
/// Daan -> Dåån -> Daaaan.
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
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
    allowed_titles: &HashSet<&str>,
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
    // generate vector a_words of all nonempty words in the string a, excluding
    // allowed titles and emojis
    let mut a_words: Vec<&str> = Vec::new();
    for word in a.split(|c: char| c.is_whitespace() || c == ',') {
        if !word.is_empty() && !allowed_titles.contains(word) && !is_allowed_emoji_word(word) {
            a_words.push(word);
        }
    }
    // finally check whether all relevant words in a are contained in b
    check_inclusion(&a_words, b.as_str(), allowed_substitutions)
}

/// Check whether `word` only consists of emojis.
/// All Unicode emojis are currently allowed.
fn is_allowed_emoji_word(word: &str) -> bool {
    for c in word.graphemes(true) {
        if emojis::get(c).is_none() {
            return false;
        }
    }
    true
}

/// Check whether all words in `a_words` are contained the string `b`, ignoring
/// the order but ensuring multiplicity is respected.
fn check_inclusion(
    a_words: &[&str],
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
) -> Result<bool, regex::Error> {
    // The map of words in b, mapping them to their multiplicity.
    let mut b_words = BTreeMap::new();
    for word in b.split(' ') {
        if !word.trim().is_empty() {
            let entry = b_words.entry(word).or_insert(0);
            *entry += 1;
        }
    }
    // Prevent denial of service by silly strings. You should not have more than 50
    // names.
    if b_words.len() > 50 {
        return Ok(false);
    }
    let mut count = 0;
    for a_word in a_words {
        // Prevent denial of service by silly strings. You should not have more than 50
        // names.
        if count > 50 {
            return Ok(false);
        }
        count += 1;
        let mut found = false;
        for (b_word, mult) in b_words.iter_mut() {
            if are_equivalent_mod_substitutions(a_word, b_word, allowed_substitutions)? && *mult > 0
            {
                *mult -= 1;
                found = true;
                break;
            }
        }
        if !found {
            return Ok(false);
        }
    }
    Ok(count >= 2)
}

/// Test whether the string `a` can be transformed into `b` using
/// `allowed_substitutions`.
fn can_transform_string(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
) -> Result<bool, regex::Error> {
    // construct regular expression from `a` replacing all characters that can be
    // substituted by `s1` or `s2` or ... or `sn` by `(s1|...|sn)`
    let mut a_regex_string = "^".to_string();
    // iterate over the visible characters (graphemes, which may consist of multiple
    // chars) in a
    for c in a.graphemes(true) {
        // escape all regular expression characters
        let c_escaped = regex::escape(c);
        match allowed_substitutions.get(c) {
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

/// Check whether the string `a` can be converted to `b` using the allowed
/// substitutions or vice versa.
fn are_equivalent_mod_substitutions(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
) -> Result<bool, regex::Error> {
    match can_transform_string(a, b, allowed_substitutions) {
        // if a can be transformed to b, we are done
        Ok(true) => Ok(true),
        // otherwise try other direction
        _ => can_transform_string(b, a, allowed_substitutions),
    }
}

/// Returns a map with default allowed substitutions.
pub fn get_allowed_substitutions() -> HashMap<&'static str, Vec<&'static str>> {
    HashMap::from([
        ("å", ["aa", "a"].to_vec()),
        ("æ", ["ae"].to_vec()),
        ("ø", ["oe", "o"].to_vec()),
        // German
        ("ä", ["ae", "a"].to_vec()),
        ("ü", ["ue", "u"].to_vec()),
        ("ö", ["oe", "o"].to_vec()),
        ("ß", ["ss", "s"].to_vec()),
        // French
        ("ç", ["c"].to_vec()),
        ("é", ["e"].to_vec()),
        ("à", ["a"].to_vec()),
        ("è", ["e"].to_vec()),
        ("ì", ["i"].to_vec()),
        ("ò", ["o"].to_vec()),
        ("ù", ["u"].to_vec()),
        ("â", ["a"].to_vec()),
        ("ê", ["e"].to_vec()),
        ("î", ["i"].to_vec()),
        ("ô", ["o"].to_vec()),
        ("û", ["u"].to_vec()),
        ("ë", ["e"].to_vec()),
        ("ï", ["i"].to_vec()),
        ("œ", ["oe"].to_vec()),
        // Slovenian
        ("č", ["c"].to_vec()),
        ("š", ["s"].to_vec()),
        ("ž", ["z"].to_vec()),
        // Turkish
        ("ğ", ["g"].to_vec()),
        ("ı", ["i"].to_vec()),
        ("ş", ["s"].to_vec()),
    ])
}

/// Returns a map with default allowed substitutions.
/// Note: Since name is converted to lowercase, all titles here must be in lower
/// case.
pub fn get_allowed_titles() -> HashSet<&'static str> {
    HashSet::from([
        "dr.", "dr", "prof.", "prof", "phd", "ph.d.", "phd.", "m.d.", "md.", "md", "l.d.", "ld.",
        "ld", "msc.", "msc", "bsc.", "bsc", "mba", "cfa",
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_test_allowed_substitutions() -> HashMap<&'static str, Vec<&'static str>> {
        let mut allowed_substitutions = get_allowed_substitutions();
        // add extra substitution only for testing
        allowed_substitutions.insert("*", ["**"].to_vec());
        allowed_substitutions.insert("षि", ["d"].to_vec());
        allowed_substitutions
    }

    #[test]
    /// Test whether matching names are accepted
    fn test_matching_names() {
        let allowed_substitutions = get_test_allowed_substitutions();
        let allowed_titles = get_allowed_titles();

        // test exact match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John Fitzgerald";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe Fitzgerald";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test subset match with order and no duplicates.
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Fitzgerald Adams Doe The Third";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test different cases
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "JOHN";
        let b2 = "doE";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test trailing whitespaces
        let a1 = "John";
        let a2 = "Doe";
        let b1 = " John";
        let b2 = "Doe  ";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test exact match containing regular expression characters
        let a1 = "John";
        let a2 = "Doe (Jr.*)";
        let b1 = "John";
        let b2 = "Doe (Jr.*)";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test basic substitutions
        let a1 = "John";
        let a2 = "Dåe";
        let b1 = "John";
        let b2 = "Daae";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test basic substitutions in other direction
        let a1 = "John";
        let a2 = "Daae";
        let b1 = "John";
        let b2 = "Dåe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test basic substitutions with uppercase special characters
        let a1 = "JOHN";
        let a2 = "DÆE";
        let b1 = "John";
        let b2 = "Daee";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test substitution with regular expression characters
        let a1 = "Jöhn";
        let a2 = "Doé (Jr.*)";
        let b1 = "John";
        let b2 = "Doe (Jr.*)";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test substitution with regular expression characters also in substituted
        // string
        let a1 = "J*hn";
        let a2 = "Doé";
        let b1 = "J**hn";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // interchanging first and last name matches
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "Doe";
        let b2 = "John";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // Multiplicity
        let a1 = "foo bar";
        let a2 = "";
        let b1 = "foo bar foo";
        let b2 = "";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test name with extended grapheme cluster
        let a1 = "John";
        let a2 = "षिoe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // titles in name are ignored
        let a1 = "Prof. Dr. John Dr. James prof";
        let a2 = "Doe, PhD";
        let b1 = "John James";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // comma separates names and titles, with or without spaces
        let a1 = "Prof., Dr. , John ,Dr., James prof,";
        let a2 = "Doe,PhD";
        let b1 = "John James";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // emojis in name are ignored
        let a1 = "John";
        let a2 = "Doe 🚀🚀🚀";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );
    }

    #[test]
    /// Test `is_allowed_emoji_word` function, both positive and negative tests.
    fn test_emojis() -> anyhow::Result<()> {
        // single emoji is allowed
        assert!(is_allowed_emoji_word("🚀"));

        // word consisting of multiple emoji is allowed
        assert!(is_allowed_emoji_word("🚀🚀🚀"));

        // flag of England consists of several characters
        assert!(is_allowed_emoji_word("🏴󠁧󠁢󠁥󠁮󠁧󠁿"));

        // combination of emojis
        assert!(is_allowed_emoji_word("🏴󠁧󠁢󠁥󠁮󠁧󠁿🚀🏴🏴"));

        // a letter is not an emoji
        assert!(!is_allowed_emoji_word("a"));

        // word is only allowed to contain emojis
        assert!(!is_allowed_emoji_word("🚀a"));

        // word is only allowed to contain emojis
        assert!(!is_allowed_emoji_word("🚀 😬"));

        // prefix of flag of England is not a valid emoji
        assert!(!is_allowed_emoji_word("🏴󠁧󠁢󠁥󠁮󠁧"));

        Ok(())
    }

    #[test]
    /// Test `check_inclusion` function, both positive and negative tests.
    fn test_inclusion() -> anyhow::Result<()> {
        let allowed_substitutions = get_test_allowed_substitutions();
        assert!(check_inclusion(
            &["foo", "bar"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(check_inclusion(
            &["foo", "bar", "baz"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(check_inclusion(
            &["foo", "bar", "baz"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(check_inclusion(
            &["foo", "bar", "baz"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        assert!(check_inclusion(
            &["foo", "baz", "bar"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        // Too short not allowed
        assert!(!check_inclusion(
            &["foo"],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        // Too short not allowed
        assert!(!check_inclusion(
            &[],
            "foo bar qux baz baz baz baz",
            &allowed_substitutions
        )?);
        Ok(())
    }

    #[test]
    /// Test whether non matching names are rejected
    fn test_non_matching_names() {
        let allowed_substitutions = get_test_allowed_substitutions();
        let allowed_titles = get_allowed_titles();

        // different first names don't match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "James";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // Wrong multiplicity does not match
        let a1 = "foo bar bar";
        let a2 = "";
        let b1 = "foo foo bar";
        let b2 = "";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // duplicate names don't match
        let a1 = "John";
        let a2 = "John";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // different last names don't match
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Smith";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test that substitutions are only applied in one direction
        let a1 = "John";
        let a2 = "Dòe";
        let b1 = "John";
        let b2 = "Doé";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test that regular expression character in name is not executed
        let a1 = "John";
        let a2 = "Do*e";
        let b1 = "John";
        let b2 = "Dooooe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test that substitution is only applied once
        let a1 = "John";
        let a2 = "Doe";
        let b1 = "J***hn";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test that the full name must match modulo substitutions
        let a1 = "Foo";
        let a2 = "Bar";
        let b1 = "oo";
        let b2 = "Bar";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test that the full name must match modulo substitutions
        let a1 = "Foo";
        let a2 = "Bar";
        let b1 = "";
        let b2 = "";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // at least two names must match
        let a1 = "John";
        let a2 = "";
        let b1 = "John";
        let b2 = "Doe Fitzgerald";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // emojis inside name are not allowed
        let a1 = "Joh🚀n";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );
    }
}
