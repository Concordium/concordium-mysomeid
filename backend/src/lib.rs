pub mod db;

use concordium::{
    base as concordium_base,
    base::{
        contracts_common::{AccountAddress, Amount},
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
#[derive(smart_contracts::common::Deserial)]
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

pub fn match_names(a1: &str, a2: &str, b1: &str, b2: &str) -> bool {
    if a1 == b1 && a2 == b2 {
        // simple case.
        return true;
    }
    let a = format!("{a1} {a2}");
    let b = format!("{b1} {b2}");

    // TODO: Allow special character mapping.
    a.to_lowercase() == b.to_lowercase()
}