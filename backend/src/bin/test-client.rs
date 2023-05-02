use anyhow::Context;
use backend::{Challenge, MintParams, PrivateTokenData, ProofWithContext};
use clap::Parser;
use concordium::{
    common::{Versioned, VERSION_0},
    id::{
        constants::{ArCurve, AttributeKind, IpPairing},
        id_proof_types::{Statement, StatementWithContext},
        types::{
            account_address_from_registration_id, AttributeTag, IdRecoveryRequest,
            IdentityObjectV1, IpInfo,
        },
    },
    types::CredentialRegistrationID,
    v2::BlockIdentifier,
};
use concordium_rust_sdk as concordium;
use key_derivation::{ConcordiumHdWallet, CredentialContext};
use tonic::transport::ClientTlsConfig;

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Api {
    #[clap(
        long = "concordium-api",
        name = "concordium-api",
        help = "GRPC V2 interface of the Concordium node.",
        default_value = "http://localhost:20000"
    )]
    api: concordium::v2::Endpoint,
    /// Request timeout for Concordium node requests.
    #[clap(
        long,
        help = "Timeout for requests to the Concordium node. In seconds.",
        default_value = "10"
    )]
    concordium_request_timeout: u64,
    /// Location of the keys used to send transactions.
    #[clap(long, help = "Path to the seed phrase file.")]
    concordium_wallet: std::path::PathBuf,
    #[clap(long = "id-object", help = "Path to the retrieved identity object.")]
    id_object: std::path::PathBuf,
    #[clap(
        long = "credential-index",
        help = "Index of the credential to use. This generates the account address."
    )]
    cred_idx: u8,
    #[clap(
        long = "linkedin-user",
        help = "URL of the linked in user. Just the user specific part."
    )]
    user_data: String,
    #[clap(
        long = "mint-url",
        help = "URL where minting data is submitted.",
        default_value = "http://localhost:8080/v1/proof/nft"
    )]
    mint_url: url::Url,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app: Api = Api::parse();

    let mut concordium_client = {
        // Use TLS if the URI scheme is HTTPS.
        // This uses whatever system certificates have been installed as trusted roots.
        let endpoint = if app
            .api
            .uri()
            .scheme()
            .map_or(false, |x| x == &http::uri::Scheme::HTTPS)
        {
            app.api
                .tls_config(ClientTlsConfig::new())
                .context("Unable to construct TLS configuration for the Concordium API.")?
        } else {
            app.api
        };
        let ep = endpoint
            .timeout(std::time::Duration::from_secs(
                app.concordium_request_timeout,
            ))
            .connect_timeout(std::time::Duration::from_secs(10));
        concordium::v2::Client::new(ep)
            .await
            .context("Unable to connect Concordium node.")?
    };

    let seed_phrase = std::fs::read_to_string(app.concordium_wallet)?;
    let words = seed_phrase.split_ascii_whitespace().collect::<Vec<_>>();
    let wallet = ConcordiumHdWallet::from_words(&words, key_derivation::Net::Testnet);

    let data: StoredIdObject = serde_json::from_reader(std::fs::File::open(app.id_object)?)?;

    let cc = CredentialContext {
        wallet,
        identity_provider_index: data.ip_info.ip_identity,
        identity_index: data.identity_index,
        credential_index: app.cred_idx,
    };

    let cred_id_exponent = cc.get_cred_id_exponent()?.context("Unlucky")?;

    let global_context = concordium_client
        .get_cryptographic_parameters(BlockIdentifier::LastFinal)
        .await?
        .response;

    // RegId as well as Prf key commitments must be computed
    // with the same generators as in the commitment key.
    let credential = CredentialRegistrationID::from_exponent(&global_context, cred_id_exponent);

    let statement = StatementWithContext {
        credential: credential.into(),
        statement:  Statement::<ArCurve, AttributeKind>::new()
            .reveal_attribute(AttributeTag(0))
            .reveal_attribute(AttributeTag(1)),
    };
    let challenge = [0u8; 32]; // TODO: :)
    let proof = statement
        .prove(&global_context, &challenge, &data.id_object.alist, &cc)
        .context("Unable to prove.")?;

    let first_name = data
        .id_object
        .alist
        .alist
        .get(&AttributeTag(0))
        .context("Name not present.")?
        .clone();
    let surname = data
        .id_object
        .alist
        .alist
        .get(&AttributeTag(1))
        .context("Surname not present.")?
        .clone();

    let account = account_address_from_registration_id(credential.as_ref());

    let mint_params = MintParams {
        account,
        platform: backend::SupportedPlatform::LinkedIn,
        private: PrivateTokenData {
            first_name,
            surname,
            user_data: app.user_data,
            challenge: Challenge { challenge },
            proof: ProofWithContext {
                credential,
                proof: Versioned::new(VERSION_0, proof),
            },
        },
    };

    let client = reqwest::Client::new();
    let mint_response: serde_json::Value = client
        .post(app.mint_url)
        .json(&mint_params)
        .send()
        .await?
        .json()
        .await?;
    println!("{}", serde_json::to_string_pretty(&mint_response).unwrap());

    Ok(())
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredIdObject {
    ip_info:        IpInfo<IpPairing>,
    id_object:      IdentityObjectV1<IpPairing, ArCurve, AttributeKind>,
    identity_index: u32,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RecoveryRequestData {
    id_recovery_request: Versioned<IdRecoveryRequest<ArCurve>>,
}
