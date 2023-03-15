use concordium_rust_sdk::id::types::AccountCredentialWithoutProofs;
use concordium_rust_sdk::v2::AccountIdentifier;
use serde_json::to_string;
use serde_json::from_str;

use hex;

use clap::Parser;
use concordium_rust_sdk::{
    common::{
        self as crypto_common,
        derive::{SerdeBase16Serialize, Serialize},
        Buffer, Deserial, ParseResult, ReadBytesExt, SerdeDeserialize, SerdeSerialize, Serial,
        Versioned,
    },
    id::{
        constants::{ArCurve, AttributeKind},
        id_proof_types::{Statement, Proof},
        types::{AccountAddress, GlobalContext},
    },
    v2::BlockIdentifier,
};
use log::info;
use concordium_rust_sdk::{
    types::CredentialRegistrationID,
};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct Result {
    name: String,
    age: u8,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ProofWithContext {
    pub credential: CredentialRegistrationID,
    pub proof: Versioned<Proof<ArCurve, AttributeKind>>,
}

/// Structure used to receive the correct command line arguments.
#[derive(clap::Parser, Debug)]
#[clap(arg_required_else_help(true))]
#[clap(version, author)]
struct IdVerifierConfig {
    #[clap(
        long = "node",
        help = "GRPC V2 interface of the node.",
        default_value = "http://146.190.94.164:20001"
    )]
    endpoint: concordium_rust_sdk::v2::Endpoint,

    #[clap(
        long = "statement",
        help = "The statement upon which the proof is generated."
    )]
    statement: String,

    #[clap(
        long = "address",
        help = "The address."
    )]
    address: AccountAddress,

    #[clap(
        long = "challenge",
        help = "The challenge."
    )]
    challenge: String,

    #[clap(
        long = "proof",
        help = "The proof."
    )]
    proof: String,
}

#[derive(Debug)]
/// An internal error type used by this server to manage error handling.
#[derive(thiserror::Error)]
pub enum InjectStatementError {
    #[error("Not allowed")]
    NotAllowed,
    #[error("Invalid proof")]
    InvalidProofs,
    #[error("Error acquiring internal lock.")]
    LockingError,
    #[error("Proof provided for an unknown session.")]
    UnknownSession,
    #[error("Issue with credential.")]
    Credential,
    #[error("Given token was expired.")]
    Expired,
}

/*impl From<concordium_rust_sdk::endpoints::QueryError> for InjectStatementError {
    fn from(error: concordium_rust_sdk::endpoints::QueryError) -> Self {
        InjectStatementError {
            message: error.to_string()
        }
    }
}*/
pub struct Challenge(pub [u8; 32]);


#[tokio::main]
async fn main() -> anyhow::Result<(), &'static str> {
    let args = IdVerifierConfig::parse();

    println!("Connecting");
    let mut client = concordium_rust_sdk::v2::Client::new(args.endpoint).await.map_err(|e| "asdasd")?; // .ok_or("asdsad");
    println!("Connected");

    let byte_array = hex::decode(args.challenge).expect("Error decoding hex string");
    if byte_array.len() != 32 {
        panic!("The string is not 32 bytes long")
    }
    let challenge_bytes: [u8; 32] = byte_array.try_into().expect("Error converting to u8 array");
    let challenge = Challenge(challenge_bytes); 
    // println!( "{:?}", hex::encode(&challenge.0 as &[u8]) );

    // pub challenge: Challenge,
    let proof: ProofWithContext = from_str(&args.proof).unwrap();

    let global_context = client
        .get_cryptographic_parameters(BlockIdentifier::LastFinal)
        .await.map_err(|e| "asdsad")?
        .response;

    println!("Aquired cryptographic parameter ");

    // let accountId: AccountIdentifier = args.address.into()
    let cred_id = proof.credential;
    let acc_info = client
        .get_account_info(&args.address.into(), BlockIdentifier::LastFinal)
        .await.map_err(|e| "asddsadas")?;

    let credential = acc_info
        .response
        .account_credentials
        .get(&0.into())
        .ok_or("Failed ")?;

    if crypto_common::to_bytes(credential.value.cred_id()) != crypto_common::to_bytes(&cred_id) {
        // return Err(InjectStatementError::Credential);
        return Err("No");
    }

    let commitments = match &credential.value {
        AccountCredentialWithoutProofs::Initial { icdv: _, .. } => {
            return Err("Initial not allowed");
        }
        AccountCredentialWithoutProofs::Normal { commitments, .. } => commitments,
    };

    let statement: Statement<ArCurve, AttributeKind> = serde_json::from_str(&args.statement).map_err(|e| "asdasd")?;

    // println!("Challenge {}", &args.challenge.0);
    // println!("Statement {}", args.statement);
    // println!("Proof {}", args.proof);
    // println!("Address {}", args.address);
    // println!("Credential {:?}", credential.value.cred_id());
    // println!("Proof {}", proof.proof.serialize().map_err(|e| "failed")? );
    // println!("{:?}", proof.proof.value );
    // println!("Challenge: {:?}", challenge_bytes );

    let result = statement.verify(
        &challenge.0,
        &global_context,
        cred_id.as_ref(),
        commitments,
        &proof.proof.value,
    );

    if (!result) {
        println!("Result: FAILED");
        return Err("Invalid result");
    }

    println!("Result: OK");

    Ok(())
}
