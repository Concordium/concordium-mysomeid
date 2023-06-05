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
use std::collections::{HashMap, HashSet};
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
/// - case and extra whitespaces are ignored and some characters may be
///   substituted,
/// - emojis and allowed titles in `a` are ignored,
/// - nicknames enclosed in quotation marks or parentheses in `a` are ignored,
/// - names in `a` can be abbreviated as their first character, optionally
///   followed by `.`,
/// - the words in name `a` must be a subset of the words in name `b`, and there
///   must be at least two words in name `a`.
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
/// - `allowed_titles` - set of all titles that that are ignored in `a`
pub fn fuzzy_match_names(
    a1: &str,
    a2: &str,
    b1: &str,
    b2: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
    allowed_titles: &HashSet<&str>,
) -> Result<bool, regex::Error> {
    // remove trailing whitespaces and concatenate into full name
    let a1_trimmed = a1.trim();
    let a2_trimmed = a2.trim();
    let b1_trimmed = b1.trim();
    let b2_trimmed = b2.trim();
    let a = format!("{a1_trimmed} {a2_trimmed}");
    let b = format!("{b1_trimmed} {b2_trimmed}");
    // if some matching intervals are found, names match according to the rules
    Ok(get_matching_intervals(&a, &b, allowed_substitutions, allowed_titles)?.is_some())
}

/// Fuzzily match names `a` and `b`. If they do not match according to the rules
/// described for the function `fuzzy_match_names`, returns `None`. Otherwise,
/// returns a vector of intervals of all words in `a` that match words in `b`,
/// as pairs of start byte offset in `a` (inclusive) and end byte offset
/// (exclusive), where `a` is UTF-8 encoded.
fn get_matching_intervals(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
    allowed_titles: &HashSet<&str>,
) -> Result<Option<Vec<(usize, usize)>>, regex::Error> {
    let a = a.to_lowercase();
    let b = b.to_lowercase();
    // Generate vector a_words of all nonempty words in the string a, excluding
    // allowed titles and emojis, together with a vector of the byte indices
    // corresponding to the beginning (inclusive) and end (exclusive) of the word in
    // the string a.
    let mut a_words: Vec<&str> = Vec::new();
    let mut a_word_indices: Vec<(usize, usize)> = Vec::new();
    for word in a.split(|c: char| c.is_whitespace() || c == ',') {
        if !word.is_empty()
            && !allowed_titles.contains(word)
            && !is_allowed_emoji_word(word)
            && !is_nickname(word)
        {
            a_words.push(word);
            // Compute byte offset of beginning of `word` in `a`. Subtracting the pointers
            // works because `split` returns an iterator over sub-slices of `a`.
            let word_begin = word.as_ptr() as usize - a.as_ptr() as usize;
            let word_end = word_begin + word.len();
            a_word_indices.push((word_begin, word_end));
        }
    }
    // require at least two matching names
    if a_words.len() < 2 {
        return Ok(None);
    }
    // finally check whether all relevant words in a are contained in b
    if check_inclusion(&a_words, &b, allowed_substitutions)? {
        return Ok(Some(a_word_indices));
    }
    Ok(None)
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

/// Determine whether `word` is to be considered a nickname that is ignored. A
/// word is a nickname if it is enclosed either in quotation marks or
/// parentheses.
fn is_nickname(word: &str) -> bool {
    (word.starts_with('\"') && word.ends_with('\"'))
        || (word.starts_with('“') && word.ends_with('”'))
        || (word.starts_with('(') && word.ends_with(')'))
}

/// Check whether all words in `a_words` are contained in the string `b`,
/// ignoring the order but ensuring multiplicity is respected. Names in `b` can
/// also occur abbreviated in `a`, either as a single grapheme or as one
/// followed by '.'.
///
/// Returns `false` if `a` or `b` contain more than 50 words to avoid
/// denial-of-service attack.
fn check_inclusion(
    a_words: &[&str],
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
) -> Result<bool, regex::Error> {
    // vector of words in b
    let mut b_words: Vec<&str> = Vec::new();
    for word in b.split(|c: char| c.is_whitespace() || c == ',') {
        if !word.is_empty() {
            b_words.push(word);
        }
    }
    // Prevent denial of service.
    if a_words.len() > 50 || b_words.len() > 50 {
        return Ok(false);
    }

    // for every a_word, build list of indices in b_words with which it can be
    // matched
    let mut matches_with: Vec<Vec<usize>> = Vec::new();
    for (ai, a_word) in a_words.iter().enumerate() {
        let a_abbrev = get_abbreviation(a_word);
        for (bi, b_word) in b_words.iter().enumerate() {
            // check whether a_word and b_word can be matched, using different logic if
            // a_word is abbreviation
            let does_match = match a_abbrev {
                Some(abbreviation) => {
                    starts_with_mod_substitutions(abbreviation, b_word, allowed_substitutions)?
                }
                None => match_mod_substitutions(a_word, b_word, allowed_substitutions)?,
            };
            if does_match {
                // add bi to list of matches for ai if it exists, otherwise add new list
                // containing bi
                if matches_with.len() > ai {
                    matches_with[ai].push(bi);
                } else {
                    matches_with.push(vec![bi]);
                }
            }
        }
        // abort if nothing can be matched with `a_word`
        if matches_with.len() <= ai {
            return Ok(false);
        }
    }

    // We now know that all words in `a` can be matched to at least one word in `b`
    // and need to find a matching such that each word in `b` is used at most once.
    // In many simple cases (e.g., if names are not reordered), matching to the
    // first possible word in `b` is sufficient, but this does not work in general.
    // E.g., for a = "Dån Dan" and b = "Dan Daan", Dån must be matched to Daan and
    // not Dan even though it matches both. We thus use a matching algorithm for
    // bipartite graphs.
    Ok(is_bipartite_matchable(&matches_with, b_words.len()))
}

/// Given adjacency list `adj` of bipartite graph with `r_num` nodes on the
/// right, determine whether there exists matching containing all nodes on the
/// left. Based on Ford-Fulkerson algorithm for maximal flow.
fn is_bipartite_matchable(adj: &[Vec<usize>], r_num: usize) -> bool {
    // vector remembering for each node on the right, to which node on the left it
    // is already matched (if any)
    let mut r_matched_to: Vec<Option<usize>> = vec![None; r_num];
    // first match all nodes on left to first possible node on right and remember
    // unmatched left nodes
    let mut l_unmatched: Vec<usize> = Vec::new();
    for (u, adj_u) in adj.iter().enumerate() {
        let mut u_matched = false;
        for v in adj_u {
            if r_matched_to[*v].is_none() {
                r_matched_to[*v] = Some(u);
                u_matched = true;
                break;
            }
        }
        if !u_matched {
            l_unmatched.push(u);
        }
    }
    if l_unmatched.is_empty() {
        return true;
    }
    // if some nodes could not be matched, try to match them by reassigning other
    // nodes
    for u in l_unmatched {
        let mut r_available = vec![true; r_num];
        if !can_extend_matching(adj, &mut r_matched_to, &mut r_available, u) {
            return false;
        }
    }
    // all nodes could be matched
    true
}

/// Given adjacency list `adj` of bipartite graph, vector of already matched
/// right nodes `r_matched_to`, vector `r_available`, and node `u` on the left,
/// try to extend existing matching by matching `u` and reassigning other nodes
/// to nodes `v` with `r_available[v] == true`.
fn can_extend_matching(
    adj: &[Vec<usize>],
    r_matched_to: &mut [Option<usize>],
    r_available: &mut [bool],
    u: usize,
) -> bool {
    for v in &adj[u] {
        if r_available[*v] {
            r_available[*v] = false; // try each v only once
            let found = match r_matched_to[*v] {
                // If `v` is already matched, recursively try to reassign.
                // Note that the recursive call is only made if `r_available[*v]`, which is
                // subsequently set to `false`. Hence, the recursion depth is limited to the number
                // of nodes on the right.
                Some(current_match) => {
                    can_extend_matching(adj, r_matched_to, r_available, current_match)
                }
                // if `v` is not matched, yet, we can match it to `u`
                None => true,
            };
            if found {
                r_matched_to[*v] = Some(u);
                return true;
            }
        }
    }
    false
}

/// If word consists only of a single grapheme or one followed by '.', return
/// this grapheme. Otherwise, return `None`.
fn get_abbreviation(word: &str) -> Option<&str> {
    if let Some(start) = word.graphemes(true).next() {
        if word == start {
            return Some(start);
        } else if let Some(word_stripped) = word.strip_suffix('.') {
            if word_stripped == start {
                return Some(start);
            }
        }
    }
    None
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
/// substitutions or vice versa. Note that this is not an equivalence relation
/// since it is not transitive.
fn match_mod_substitutions(
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

/// Test whether the string `b` starts with `a` using
/// `allowed_substitutions`. It is assumed that `a` is a single grapheme.
fn starts_with_mod_substitutions(
    a: &str,
    b: &str,
    allowed_substitutions: &HashMap<&str, Vec<&str>>,
) -> Result<bool, regex::Error> {
    if b.starts_with(a) {
        return Ok(true);
    }
    // if `b` does not start with `a`, try possible substitutions for `a`
    if let Some(a_subs) = allowed_substitutions.get(a) {
        for si in a_subs {
            if b.starts_with(si) {
                return Ok(true);
            }
        }
    }
    // finally try substitutions for first grapheme in `b`
    if let Some(b_start) = b.graphemes(true).next() {
        if let Some(b_subs) = allowed_substitutions.get(b_start) {
            for si in b_subs {
                if si.starts_with(a) {
                    return Ok(true);
                }
            }
        }
    }
    // no match found
    Ok(false)
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

        // test abbreviated middle name
        let a1 = "John F.";
        let a2 = "Doe";
        let b1 = "John Fitzgerald";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test nontrivial matching with substitutions (Dån matches both Dan and Daan,
        // but must be matched with Daan).
        let a1 = "Dån Dan";
        let a2 = "Doe";
        let b1 = "Dan Daan";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test many middle names
        let a1 = "John J. J James";
        let a2 = "Doe 🚀";
        let b1 = "Jonas John James Jacob";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test middle names with special characters matching
        let a1 = "John Ä";
        let a2 = "Doe";
        let b1 = "John Ägidius";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test middle names with special characters matching
        let a1 = "John Æ";
        let a2 = "Doe";
        let b1 = "John Aegidius";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test middle names with special characters matching
        let a1 = "John A";
        let a2 = "Doe";
        let b1 = "John Ægidius";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test nicknames
        let a1 = "John \"Johnny\"";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test nicknames
        let a1 = "John “Johnny”";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test nicknames
        let a1 = "John (Johnny)";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );
    }

    #[test]
    /// Test `get_matching_intervals` function, both positive and negative
    /// tests.
    fn test_matching_intervals() -> anyhow::Result<()> {
        let allowed_substitutions = get_test_allowed_substitutions();
        let allowed_titles = get_allowed_titles();

        // all names match
        assert_eq!(
            get_matching_intervals(
                "John Doe",
                "John Doe",
                &allowed_substitutions,
                &allowed_titles
            ),
            Ok(Some([(0, 4), (5, 8)].to_vec()))
        );

        // title and emoji are ignored, 🚀 is 4 bytes long
        assert_eq!(
            get_matching_intervals(
                "Dr. John 🚀 Doe 🚀",
                "John Doe",
                &allowed_substitutions,
                &allowed_titles
            ),
            Ok(Some([(4, 8), (14, 17)].to_vec()))
        );

        Ok(())
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
    /// Test `get_abbreviation` function.
    fn test_abbreviation() -> anyhow::Result<()> {
        // Just one letter is recognized
        assert_eq!(get_abbreviation("F"), Some("F"));

        // One letter with dot is recognized
        assert_eq!(get_abbreviation("F."), Some("F"));

        // Multiple letters are rejected
        assert_eq!(get_abbreviation("Fi"), None);
        assert_eq!(get_abbreviation("Fi."), None);
        assert_eq!(get_abbreviation("F.."), None);

        // test single letter with extended grapheme cluster
        assert_eq!(get_abbreviation("षि"), Some("षि"));
        assert_eq!(get_abbreviation("षि."), Some("षि"));
        assert_eq!(get_abbreviation("षिx"), None);
        assert_eq!(get_abbreviation("aषि"), None);

        Ok(())
    }

    #[test]
    /// Test `starts_with_mod_substitutions` function.
    fn test_starts_with() -> anyhow::Result<()> {
        let allowed_substitutions = get_test_allowed_substitutions();
        assert!(starts_with_mod_substitutions("f", "f", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("f", "fitzgerald", &allowed_substitutions).unwrap());
        assert!(!starts_with_mod_substitutions("f", "affe", &allowed_substitutions).unwrap());
        assert!(!starts_with_mod_substitutions("f", "af", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("ä", "aegidius", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("a", "ägidius", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("a", "ægidius", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("æ", "ægidius", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("æ", "aegidius", &allowed_substitutions).unwrap());
        assert!(!starts_with_mod_substitutions("æ", "anton", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("षि", "षिoe", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("d", "षिoe", &allowed_substitutions).unwrap());
        assert!(starts_with_mod_substitutions("षि", "doe", &allowed_substitutions).unwrap());
        assert!(!starts_with_mod_substitutions("षि", "joe", &allowed_substitutions).unwrap());

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

        // test abbreviated middle name
        let a1 = "John F.";
        let a2 = "Doe";
        let b1 = "John Donald";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test middle names not matching
        let a1 = "John J. J. James";
        let a2 = "Doe";
        let b1 = "Jonas James James";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test missing space
        let a1 = "John JJ";
        let a2 = "Doe";
        let b1 = "John James James";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test middle names not matching
        let a1 = "John J. J. James";
        let a2 = "Doe";
        let b1 = "James James James James";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // test special character abbreviation not matching
        let a1 = "John Æ";
        let a2 = "Doe";
        let b1 = "John Anton";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // nickname delimiters must match
        let a1 = "John (Johnny\"";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );

        // real names must still match if nicknames are used
        let a1 = "Johnny (John)";
        let a2 = "Doe";
        let b1 = "John";
        let b2 = "Doe";
        assert!(
            !fuzzy_match_names(a1, a2, b1, b2, &allowed_substitutions, &allowed_titles).unwrap()
        );
    }
}
