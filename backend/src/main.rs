// TODO:
// - Store sent transactions for recovery
// - Rate limiting of sponsored transactions.
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
pub use anyhow::Context;
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    headers::ContentType,
    http::StatusCode,
    TypedHeader,
};
use axum_prometheus::PrometheusMetricLayerBuilder;
use backend::{match_names, ContractClient, ContractQueryError, SupportedPlatform};
use clap::Parser;
use concordium::{
    common::{self, Versioned, VERSION_0},
    id::{
        constants::{ArCurve, AttributeKind},
        id_proof_types::{Proof, Statement},
        types::AccountCredentialWithoutProofs,
    },
    smart_contracts::{self, common::AccountAddress},
    types::{
        ContractAddress, CredentialRegistrationID, CryptographicParameters, Energy, WalletAccount,
    },
    v2::{self, BlockIdentifier},
};
use concordium_base::{
    contracts_common::Amount,
    smart_contracts::{OwnedParameter, OwnedReceiveName},
    transactions::{self, BlockItem, EncodedPayload, UpdateContractPayload},
};
use concordium_rust_sdk as concordium;
use image::GenericImageView;
// use postgres_types::FromSql;
use rand::Rng;
use reqwest::Url;
use sha2::Digest;
use std::{
    collections::BTreeMap,
    io::Read,
    path::PathBuf,
    str::FromStr,
    sync::{Arc, Mutex},
};
use tokio::sync::mpsc::error::TrySendError;
// use tokio_postgres::NoTls;
use tonic::transport::ClientTlsConfig;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse};

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Api {
    #[clap(
        long = "concordium-api",
        name = "concordium-api",
        help = "GRPC V2 interface of the Concordium node.",
        env = "ETHCCD_RELAYER_CONCORDIUM_API",
        default_value = "http://localhost:20000"
    )]
    api: concordium::v2::Endpoint,
    /// Request timeout for Concordium node requests.
    #[clap(
        long,
        help = "Timeout for requests to the Concordium node.",
        env = "ETHCCD_RELAYER_CONCORDIUM_REQUEST_TIMEOUT",
        default_value = "10"
    )]
    concordium_request_timeout: u64,
    /// Location of the keys used to send transactions.
    #[clap(
        long,
        help = "Path to the key file.",
        env = "MYSOMEID_WALLET",
        default_value = "10"
    )]
    concordium_wallet: std::path::PathBuf,
    /// Address of the mysomeid contract.
    #[clap(
        long,
        help = "Address of the instance of mysomeid..",
        env = "MYSOMEID_CONTRACT",
        default_value = "10"
    )]
    concordium_contract: ContractAddress,
    /// Request timeout for Concordium node requests.
    #[clap(
        long = "base-url",
        help = "Base URL of the backend.",
        env = "MYSOMEID_BASE_URL"
    )]
    base_url: Url,
    #[clap(
        long = "nft-image",
        help = "Path to the PNG nft image.",
        env = "MYSOMEID_NFT_IMAGE"
    )]
    nft_image: PathBuf,
    #[clap(
        long = "nft-image-revoked",
        help = "Path to the PNG nft image for revoked tokens.",
        env = "MYSOMEID_NFT_IMAGE_REVOKED"
    )]
    nft_image_revoked: PathBuf,
    #[clap(
        long = "log-level",
        default_value = "info",
        help = "Maximum log level.",
        env = "ETHCCD_API_LOG_LEVEL"
    )]
    log_level: tracing_subscriber::filter::LevelFilter,
    #[clap(
        long = "db",
        default_value = "host=localhost dbname=relayer user=postgres password=password port=5432",
        help = "Database connection string.",
        env = "ETHCCD_API_DB_STRING"
    )]
    db_config: tokio_postgres::Config,
    #[clap(
        long = "listen-address",
        default_value = "0.0.0.0:8080",
        help = "Listen address for the server.",
        env = "ETHCCD_API_LISTEN_ADDRESS"
    )]
    listen_address: std::net::SocketAddr,
    #[clap(
        long = "prometheus-address",
        default_value = "0.0.0.0:9090",
        help = "Listen address for the server.",
        env = "ETHCCD_API_PROMETHEUS_ADDRESS"
    )]
    prometheus_address: Option<std::net::SocketAddr>,
    #[clap(
        long = "max-pool-size",
        default_value = "16",
        help = "Maximum size of a database connection pool.",
        env = "ETHCCD_API_MAX_DB_CONNECTION_POOL_SIZE"
    )]
    max_pool_size: usize,
    #[clap(
        long = "request-timeout",
        default_value = "1000",
        help = "Request timeout in millisecons.",
        env = "ETHCCD_API_REQUEST_TIMEOUT"
    )]
    request_timeout: u64,
    #[clap(
        long = "assets-dir",
        help = "Serve files from the supplied directory under /assets.",
        env = "ETHCCD_API_SERVE_ASSETS"
    )]
    assets_dir: Option<PathBuf>,
    #[clap(
        long = "log-headers",
        help = "Whether to log headers for requests and responses.",
        env = "ETHCCD_API_LOG_HEADERS"
    )]
    log_headers: bool,
}

#[derive(Debug, Clone)]
struct ServiceState {
    pub client:            reqwest::Client,
    pub concordium_client: concordium::v2::Client,
    pub crypto_params:     Arc<CryptographicParameters>,
    pub base_url:          Arc<Url>,
    pub statement:         Arc<Statement<ArCurve, AttributeKind>>,
    pub nft_image:         Bytes,
    pub nft_image_revoked: Bytes,
    pub signer:            Arc<WalletAccount>,
    pub contract_address:  ContractAddress,
    // We deliberately use a mutex here instead of an atomicu64.
    // We use the mutex for synchronization of other actions to make sure
    // that we don't skip nonces in case of other failures, such as failure to send a transaction.
    pub nonce_counter:     Arc<Mutex<concordium::types::Nonce>>,
    pub tx_sender: tokio::sync::mpsc::Sender<(concordium::types::Nonce, BlockItem<EncodedPayload>)>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app: Api = Api::parse();
    {
        use tracing_subscriber::prelude::*;
        let log_filter = tracing_subscriber::filter::Targets::new()
            .with_target(module_path!(), app.log_level)
            .with_target("tower_http", app.log_level)
            .with_target("tokio_postgres", app.log_level);
        tracing_subscriber::registry()
            .with(tracing_subscriber::fmt::layer())
            .with(log_filter)
            .init();
    }

    let (prometheus_layer, metric_handle) = PrometheusMetricLayerBuilder::new()
        .with_default_metrics()
        .with_prefix("mysomeid")
        .build_pair();

    // let db = Database::new(app.db_config, app.max_pool_size).await?;

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

    let global_context = concordium_client
        .get_cryptographic_parameters(BlockIdentifier::LastFinal)
        .await
        .context("Unable to get cryptographic parameters from the node.")?
        .response;

    // Serve static files.
    let router = if let Some(assets_dir) = app.assets_dir {
        axum::Router::new().nest_service("/assets", tower_http::services::ServeDir::new(assets_dir))
    } else {
        axum::Router::new()
    };

    let signer =
        WalletAccount::from_json_file(app.concordium_wallet).context("Unable to read keys.")?;

    let starting_nonce = concordium_client
        .get_next_account_sequence_number(&signer.address)
        .await
        .context("Unable to get starting nonce.")?;
    anyhow::ensure!(
        starting_nonce.all_final,
        "There are unfinalized transactions. Refusing to start."
    );

    // TODO: Add limits
    let client = reqwest::ClientBuilder::new()
        .connect_timeout(std::time::Duration::from_secs(2))
        .build()
        .context("Unable to build network client.")?;

    let (sender, receiver) = tokio::sync::mpsc::channel(10);

    let state = ServiceState {
        client,
        concordium_client: concordium_client.clone(),
        crypto_params: Arc::new(global_context),
        base_url: Arc::new(app.base_url),
        statement: Arc::new(
            Statement::new()
                .reveal_attribute("firstName".parse().unwrap())
                .reveal_attribute("lastName".parse().unwrap()),
        ),
        nft_image: Bytes::from(
            std::fs::read(app.nft_image).context("Unable to read the NFT image")?,
        ),
        nft_image_revoked: Bytes::from(
            std::fs::read(app.nft_image_revoked).context("Unable to read the NFT image")?,
        ),
        signer: Arc::new(signer),
        contract_address: app.concordium_contract,
        nonce_counter: Arc::new(Mutex::new(starting_nonce.nonce)),
        tx_sender: sender,
    };

    // build our application with a route
    let api = router
        .route(
            "/proof/statement",
            axum::routing::get(get_statement),
        )
        .route(
            "/proof/challenge",
            axum::routing::get(get_challenge),
        )
        .route(
            "/proof/verify",
            axum::routing::post(verify_proof),
        )
        .route(
            "/proof/nft",
            axum::routing::post(mint_nft),
        )
        .route(
            "/proof/:proofId/:encryptionKey/nft",
            axum::routing::get(get_proof),

        )
        .route(
            "/proof/validate-proof-url",
            axum::routing::get(validate_proof),
        )
        .route(
            "/proof/validate",
            axum::routing::get(validate_proof),
        )
        .route(
            "/proof/meta/:proof",
            axum::routing::get(get_metadata),
        )
        .route(
            "/proof/:proof/img",
            axum::routing::get(get_img),
        )
        .route(
            "/qr/validate",
            axum::routing::get(parse_qr),
        )
        .route(
            "/qr/image/scan", // TODO: This is duplicate, there is no point in this.
            axum::routing::get(parse_qr),
        )
        .with_state(state)
        .layer(tower_http::trace::TraceLayer::new_for_http().
               make_span_with(DefaultMakeSpan::new().
                              include_headers(app.log_headers)).
               on_response(DefaultOnResponse::new().
                           include_headers(app.log_headers)))
        .layer(tower_http::timeout::TimeoutLayer::new(
            std::time::Duration::from_millis(app.request_timeout),
        ))
        // TODO: .layer(tower_http::limit::RequestBodyLimitLayer::new(0)) // no bodies, we only have GET requests.
        // TODO: .layer(tower_http::cors::CorsLayer::permissive().allow_methods([http::Method::GET]))
        .layer(prometheus_layer);

    if let Some(prometheus_address) = app.prometheus_address {
        let prometheus_api = axum::Router::new()
            .route(
                "/metrics",
                axum::routing::get(|| async move { metric_handle.render() }),
            )
            .layer(tower_http::timeout::TimeoutLayer::new(
                std::time::Duration::from_millis(1000),
            ))
            .layer(tower_http::limit::RequestBodyLimitLayer::new(0));
        tokio::spawn(async move {
            axum::Server::bind(&prometheus_address)
                .serve(prometheus_api.into_make_service())
                .await
                .context("Unable to start Prometheus server.")?;
            Ok::<(), anyhow::Error>(())
        });
    }

    let tx_sender_handle =
        tokio::spawn(tx_sender(starting_nonce.nonce, receiver, concordium_client));

    // run our app with hyper
    tracing::debug!("listening on {}", app.listen_address);
    axum::Server::bind(&app.listen_address)
        .serve(api.into_make_service())
        .await
        .context("Unable to start server.")?;
    Ok(())
}

#[tracing::instrument(level = "debug")]
/// Get the statement
async fn get_statement(
    State(ServiceState { statement, .. }): State<ServiceState>,
) -> axum::Json<serde_json::Value> {
    serde_json::json!({ "statement": &*statement }).into()
}

// TODO: ProofId should not be a string. It should be a base64
type ProofId = u64;

#[derive(Debug, serde::Deserialize)]
struct MetadataQueryParams {
    #[serde(rename = "p")]
    platform: SupportedPlatform,
    #[serde(rename = "r")]
    revoked:  u8,
}
#[tracing::instrument(level = "debug", skip_all)]
/// Get the statement
async fn get_metadata(
    Path(proof): Path<ProofId>,
    Query(params): Query<MetadataQueryParams>,
    State(ServiceState { base_url, .. }): State<ServiceState>,
) -> axum::Json<serde_json::Value> {
    let base_url: Url = (*base_url).clone();
    serde_json::json!({
        "name": "MYSOME.ID",
        "decimals": 0,
        "description": "Soulbound NFT used to prove that a profile on a social media account is valid.",
        "unique": true,
        "thumbnail": {
          "url": make_img_url(base_url.clone(), &proof, &params, true),
        },
        "display": {
          "url": make_img_url(base_url, &proof, &params, false),
        },
    }).into()
}

fn make_img_url(
    mut base: Url,
    proof_id: &ProofId,
    params: &MetadataQueryParams,
    thumbnail: bool,
) -> Url {
    base.set_path(&format!("v1/proof/{proof_id}/img"));
    base.set_query(Some(&format!(
        "t={}&p={}&r={}",
        if thumbnail { "thumb" } else { "display" },
        params.platform,
        params.revoked
    )));
    base
}

#[derive(Debug, serde::Deserialize)]
enum ImageVariant {
    #[serde(rename = "thumb")]
    Thumbnail,
    #[serde(rename = "display")]
    Display,
}

#[derive(Debug, serde::Deserialize)]
struct ImgQueryParams {
    #[serde(rename = "r")]
    revoked: u8,
}

#[tracing::instrument(level = "debug", skip_all)]
/// Get the NFT image.
/// TODO: This currently returns the same image for everything. It ignores all
/// parameters apart from "revoked".
async fn get_img(
    Path(_proof): Path<ProofId>,
    Query(params): Query<ImgQueryParams>,
    State(ServiceState {
        nft_image,
        nft_image_revoked,
        ..
    }): State<ServiceState>,
) -> impl axum::response::IntoResponse {
    if params.revoked != 0 {
        (TypedHeader(ContentType::png()), nft_image_revoked)
    } else {
        (TypedHeader(ContentType::png()), nft_image)
    }
}

#[derive(Debug, serde::Deserialize)]
struct ParseQRParams {
    url: Url,
}

// 2MB
const MAX_IMAGE_SIZE: u64 = 2_000_000;

#[tracing::instrument(level = "debug", skip_all)]
async fn parse_qr(
    Query(ParseQRParams { url }): Query<ParseQRParams>,
    State(ServiceState { client, .. }): State<ServiceState>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    let mut data = match client
        .get(url)
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(data) => data,
        Err(e) => {
            tracing::debug!("Unable to access image: {e}");
            return Err(Error::InvalidRequest(
                "Unable to access the requested image.".into(),
            ));
        }
    };
    if !data.status().is_success() {
        return Err(Error::InvalidRequest("Cannot access the image.".into()));
    }
    // TODO: Can we afford to reject if content_length is not set?
    if let Some(img_size) = data.content_length() {
        if img_size > MAX_IMAGE_SIZE {
            return Err(Error::InvalidRequest(
                "The image is too large ({img_size})B.".into(),
            ));
        }
    }
    let mut img_data = Vec::new();
    // TODO: Make sure that chunk sizes are sufficiently small.
    // TODO: Timeout this entire process.
    while let Some(chunk) = data
        .chunk()
        .await
        .map_err(|_| Error::InvalidRequest("Unable to access requested image.".into()))?
    {
        if img_data.len().saturating_add(chunk.len()) > MAX_IMAGE_SIZE as usize {
            return Err(Error::InvalidRequest(
                "The image is too large ({img_size})B.".into(),
            ));
        }
        img_data.extend_from_slice(&chunk);
    }
    let img = match image::load_from_memory(&img_data) {
        Ok(img) => img,
        Err(e) => {
            tracing::debug!("Cannot decode image: {e}");
            return Err(Error::InvalidRequest("Unreadable image.".into()));
        }
    };
    let (width, height) = img.dimensions();
    let mut scanner = zbar_rust::ZBarImageScanner::new();
    let results = match scanner.scan_y800(img.into_luma8().into_raw(), width, height) {
        Ok(results) => results,
        Err(e) => {
            tracing::debug!("Cannot scan image: {e}");
            return Err(Error::InvalidRequest("Unreadable image.".into()));
        }
    };
    // Return the first match.
    for result in results {
        match String::from_utf8(result.data) {
            Ok(v) => {
                return Ok(axum::Json(serde_json::json!({ "result": Some(v) })));
            }
            Err(e) => {
                tracing::debug!("Not a UTF8 string in the code: {e}");
            }
        }
    }
    Ok(axum::Json(serde_json::json!({ "result": None::<String> })))
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChallengeParams {
    platform:  SupportedPlatform,
    user_data: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Copy, common::Serialize)]
#[serde(into = "String", try_from = "String")]
struct Challenge {
    challenge: [u8; 32],
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

#[tracing::instrument(level = "debug", skip_all)]
/// Get the statement
async fn get_challenge(
    Query(ChallengeParams {
        platform,
        user_data,
    }): Query<ChallengeParams>,
) -> axum::Json<serde_json::Value> {
    let mut hasher = sha2::Sha256::new();
    hasher.update((platform as u32).to_be_bytes());
    hasher.update(user_data);
    serde_json::json!({
        "challenge": Challenge{ challenge: hasher.finalize().into() }
    })
    .into()
}

#[derive(serde::Deserialize, Debug, Clone, common::Serialize, serde::Serialize)]
pub struct ProofWithContext {
    pub credential: CredentialRegistrationID,
    pub proof:      Versioned<Proof<ArCurve, AttributeKind>>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyParams {
    account:   AccountAddress,
    proof:     ProofWithContext,
    challenge: Challenge,
}

/// Get the statement
#[tracing::instrument(level = "debug", skip_all)]
async fn verify_proof(
    State(ServiceState {
        concordium_client,
        crypto_params,
        statement,
        ..
    }): State<ServiceState>,
    axum::Json(params): axum::Json<VerifyParams>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    let result = verify_proof_worker(concordium_client, crypto_params, statement, params).await?;
    Ok(axum::Json(serde_json::json!({ "result": result })))
}

async fn verify_proof_worker(
    mut concordium_client: v2::Client,
    crypto_params: Arc<CryptographicParameters>,
    statement: Arc<Statement<ArCurve, AttributeKind>>,
    VerifyParams {
        account,
        proof,
        challenge,
    }: VerifyParams,
) -> Result<bool, Error> {
    if proof.proof.version != VERSION_0 {
        return Err(Error::InvalidRequest(
            "Only version 0 proofs are supported.".into(),
        ));
    }
    let account = match concordium_client
        .get_account_info(&account.into(), BlockIdentifier::LastFinal)
        .await
    {
        Ok(ai) => ai.response,
        Err(e) if e.is_not_found() => {
            return Err(Error::InvalidRequest(
                "Account does not exist on the chain.".into(),
            ));
        }
        Err(e) => {
            tracing::error!("Error querying account: {e}");
            return Err(Error::Internal);
        }
    };
    let Some(commitments) = account.account_credentials.into_values().find_map(|cred| {
        if let AccountCredentialWithoutProofs::Normal { cdv, commitments } = cred.value {
            if &cdv.cred_id == proof.credential.as_ref() {
                Some(commitments)
            } else {
                None
            }
        } else {
            None
        }
    }) else {
        return Err(Error::InvalidRequest("The requested account does not have a matching credential.".into()));
    };
    let result = statement.verify(
        &challenge.challenge,
        &crypto_params,
        proof.credential.as_ref(),
        &commitments,
        &proof.proof.value,
    );
    Ok(result)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValidateProofParams {
    url:        Url,
    // Name as appearing on the profile.
    first_name: String,
    // Name as appearing on the profile.
    last_name:  String,
    platform:   SupportedPlatform,
    user_data:  String,
}

// The URL is meant to be in the format
// base/:tokenId/:decryptionKey
// Where tokenId is a u64 (represented as a number), and decryption key is
// base64 encoded (and then URI encoded if necessary)
fn get_token_id_and_key(url: &Url) -> Option<(u64, EncryptionKey)> {
    let mut path_segments = url.path_segments()?;
    let key_b64 = percent_encoding::percent_decode_str(path_segments.next()?)
        .decode_utf8()
        .ok()?;
    let key = key_b64.parse::<EncryptionKey>().ok()?;
    let id = path_segments.next()?;
    let id = id.parse::<u64>().ok()?;
    Some((id, key))
}

#[tracing::instrument(level = "debug", skip_all)]
async fn validate_proof(
    Query(ValidateProofParams {
        url,
        first_name,
        last_name,
        platform,
        user_data,
    }): Query<ValidateProofParams>,
    State(ServiceState {
        concordium_client,
        contract_address,
        crypto_params,
        statement,
        ..
    }): State<ServiceState>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    let Some((token_id, key)) = get_token_id_and_key(&url) else {
        return Err(Error::InvalidRequest("Could not parse token id and key from the URL.".into()));
    };
    let proof =
        get_proof_worker(token_id, concordium_client.clone(), contract_address, key).await?;

    if proof.revoked {
        return Ok(axum::Json(
            serde_json::json!({"status": "invalid", "id": token_id}),
        ));
    }

    if platform != proof.platform {
        return Ok(axum::Json(
            serde_json::json!({"status": "invalid", "id": token_id}),
        ));
    }

    if user_data != proof.private.user_data {
        return Ok(axum::Json(
            serde_json::json!({"status": "invalid", "id": token_id}),
        ));
    }

    // Ensure that the parameters stored in the proof are the same as that sent in
    // the query parameters.
    if !match_names(
        &first_name,
        &last_name,
        proof.private.first_name.0.as_str(),
        proof.private.surname.0.as_str(),
    ) {
        return Ok(axum::Json(
            serde_json::json!({"status": "invalid", "id": token_id}),
        ));
    }

    let res = verify_proof_worker(concordium_client, crypto_params, statement, VerifyParams {
        account:   proof.owner,
        proof:     proof.private.proof,
        challenge: proof.private.challenge,
    })
    .await?;
    Ok(axum::Json(
        serde_json::json!({"status": if res { "valid" } else {"invalid"}, "id": token_id}),
    ))
}

#[derive(serde::Serialize, serde::Deserialize, Copy, Clone)]
#[serde(try_from = "String", into = "String")]
struct EncryptionKey {
    key: [u8; 32],
}

impl From<EncryptionKey> for String {
    fn from(value: EncryptionKey) -> Self {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.encode(value.key)
    }
}

impl TryFrom<String> for EncryptionKey {
    type Error = anyhow::Error;

    fn try_from(value: String) -> Result<Self, Self::Error> { value.as_str().try_into() }
}

impl TryFrom<&str> for EncryptionKey {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        use base64::Engine;
        let key = base64::engine::general_purpose::STANDARD.decode(value)?;
        match key.try_into() {
            Ok(key) => Ok(Self { key }),
            Err(_) => {
                anyhow::bail!("Incorrect key length. Key must be exactly 32 bytes.")
            }
        }
    }
}

impl FromStr for EncryptionKey {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> { EncryptionKey::try_from(s) }
}

#[tracing::instrument(level = "debug", skip_all)]
async fn get_proof(
    Path(token_id): Path<ProofId>,
    Path(key): Path<EncryptionKey>,
    State(ServiceState {
        concordium_client,
        contract_address,
        ..
    }): State<ServiceState>,
) -> Result<axum::Json<GetProofResponse>, Error> {
    get_proof_worker(token_id, concordium_client, contract_address, key)
        .await
        .map(axum::Json)
}

#[tracing::instrument(level = "debug", skip_all)]
async fn get_proof_worker(
    token_id: ProofId,
    concordium_client: v2::Client,
    contract_address: ContractAddress,
    key: EncryptionKey,
) -> Result<GetProofResponse, Error> {
    let mut contract_client = ContractClient {
        address: contract_address,
        client:  concordium_client,
    };

    let response = match contract_client.view_token_data(&token_id).await {
        Ok(response) => response,
        Err(e) => match e {
            ContractQueryError::Network(rpc) => {
                tracing::error!("Error querying the contract: {rpc}");
                return Err(Error::Internal);
            }
            ContractQueryError::InvokeFailure(_) => {
                return Err(Error::InvalidRequest(
                    "The contract entrypoint failed.".into(),
                ));
            }
            ContractQueryError::ParseResponseFailure => {
                tracing::error!(
                    "Could not parse response from the contract. This is likely a configuration \
                     error."
                );
                return Err(Error::Internal);
            }
        },
    };

    let Some(view_data) = response else {
        return Err(Error::InvalidRequest("No token with the given token ID.".into()))
    };

    let encryption_data = &view_data.data;

    let cipher = Aes256Gcm::new((&key.key).into());

    let (nonce, ciphertext) = {
        let mut cursor = std::io::Cursor::new(&encryption_data);
        let mut version = [0u8; 4];
        if cursor.read_exact(&mut version).is_err() {
            return Err(Error::InvalidRequest(
                "The stored proof cannot be read.".into(),
            ));
        }
        if version != [0u8; 4] {
            return Err(Error::InvalidRequest(
                "Only version 0 proofs are supported.".into(),
            ));
        }
        let mut nonce = [0u8; 12];
        if cursor.read_exact(&mut nonce).is_err() {
            return Err(Error::InvalidRequest(
                "The stored proof cannot be read.".into(),
            ));
        }
        (nonce, &encryption_data[16..])
    };

    let proof_data_bytes = cipher
        .decrypt((&nonce).into(), ciphertext)
        .map_err(|_| Error::InvalidRequest("Unable to decrypt data.".into()))?;

    let Ok(private) = common::from_bytes::<PrivateTokenData, _>(&mut std::io::Cursor::new(proof_data_bytes)) else { return Err(Error::InvalidRequest("Could not read stored private token data.".into()))};

    Ok(GetProofResponse {
        id: token_id,
        platform: view_data.platform,
        revoked: view_data.revoked,
        owner: view_data.owner,
        private,
    })
}

#[derive(serde::Deserialize, serde::Serialize)]
struct GetProofResponse {
    id:       ProofId,
    owner:    AccountAddress,
    platform: SupportedPlatform,
    revoked:  bool,
    #[serde(flatten)]
    private:  PrivateTokenData,
}

#[derive(serde::Deserialize, common::Serialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PrivateTokenData {
    first_name: AttributeKind,
    #[serde(rename = "surName")]
    surname:    AttributeKind,
    #[string_size_length = 4]
    user_data:  String,
    challenge:  Challenge,
    proof:      ProofWithContext,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct MintParams {
    account:  AccountAddress,
    platform: SupportedPlatform,
    #[serde(flatten)]
    private:  PrivateTokenData,
}

#[tracing::instrument(level = "debug", skip_all)]
async fn mint_nft(
    State(ServiceState {
        mut concordium_client,
        crypto_params,
        statement,
        signer,
        contract_address,
        nonce_counter,
        tx_sender,
        ..
    }): State<ServiceState>,
    axum::Json(MintParams {
        account,
        platform,
        private,
    }): axum::Json<MintParams>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    if private.proof.proof.version != VERSION_0 {
        return Err(Error::InvalidRequest(
            "Only version 0 proofs are supported.".into(),
        ));
    }
    let account_info = match concordium_client
        .get_account_info(&account.into(), BlockIdentifier::LastFinal)
        .await
    {
        Ok(ai) => ai.response,
        Err(e) if e.is_not_found() => {
            return Err(Error::InvalidRequest(
                "Account does not exist on the chain.".into(),
            ));
        }
        Err(e) => {
            tracing::error!("Error querying account: {e}");
            return Err(Error::Internal);
        }
    };
    let Some(commitments) = account_info.account_credentials.into_values().find_map(|cred| {
        if let AccountCredentialWithoutProofs::Normal { cdv, commitments } = cred.value {
            if &cdv.cred_id == private.proof.credential.as_ref() {
                Some(commitments)
            } else {
                None
            }
        } else {
            None
        }
    }) else {
        return Err(Error::InvalidRequest("The requested account does not have a matching credential.".into()));
    };
    let result = statement.verify(
        &private.challenge.challenge,
        &crypto_params,
        private.proof.credential.as_ref(),
        &commitments,
        &private.proof.proof.value,
    );

    if !result {
        return Err(Error::InvalidRequest("Proof is not valid.".into()));
    }

    let proof_data = common::to_bytes(&private);

    let mut rng = rand::thread_rng();

    // We have verified the request. Now we mint.
    let key = Aes256Gcm::generate_key(&mut rng);
    let cipher = Aes256Gcm::new(&key);
    // We use a fixed nonce.
    let nonce = rng.gen::<[u8; 16]>();
    let nonce = Nonce::from_slice(&nonce);
    let mut aux_data = {
        let mut aux_data = vec![0u8; 4]; // version number.
        aux_data.extend_from_slice(nonce);
        aux_data
    };
    let mut ciphertext = cipher
        .encrypt(nonce, &proof_data[..])
        // TODO: Log error
        .map_err(|_| Error::Internal)?;
    aux_data.append(&mut ciphertext);
    let mint_params = ContractMintParams {
        owner: account,
        platform,
        data: ciphertext,
    };

    let update_payload = UpdateContractPayload {
        amount:       Amount::zero(),
        address:      contract_address,
        receive_name: OwnedReceiveName::new_unchecked("mysomeid.mint".into()),
        // TODO: Log error.
        message:      OwnedParameter::from_serial(&mint_params).map_err(|_| Error::Internal)?,
    };

    // TODO: It is crucial that there is no await between nonce counter update and
    // enqueueing the transaction. This ensures that a client cancelling the
    // request in between will mess up our nonce handling by causing us to bump the
    // nonce but not enqueue the transaction.

    // now we need to actually mint.
    // First make the transaction.
    let Ok(mut nonce_counter) = nonce_counter.lock() else {
        tracing::error!("Unable to acquire lock.");
        return Err(Error::Internal);
    };

    let expiry = common::types::TransactionTime::from_seconds(
        chrono::offset::Utc::now().timestamp() as u64 + 3600,
    ); // 1h expiry.
    const MINT_ENERGY: Energy = Energy { energy: 10_000 };
    let tx = transactions::send::update_contract(
        &*signer,
        signer.address,
        *nonce_counter,
        expiry,
        update_payload,
        MINT_ENERGY,
    );
    let bi = BlockItem::from(tx);
    let hash = bi.hash();
    if let Err(e) = tx_sender.try_send((*nonce_counter, bi)) {
        match e {
            TrySendError::Full(_) => {
                tracing::warn!("Unable to enqueue transaction.");
                Err(Error::Busy)
            }
            TrySendError::Closed(_) => {
                // This means that the transaction sender task is dead. We return internal
                // server error.
                tracing::error!(
                    "Unable to enqueue transaction since the transaction sender is dead."
                );
                Err(Error::Internal)
            }
        }
    } else {
        nonce_counter.next_mut();
        drop(nonce_counter); // drop the lock. Other transactions may now be enqueued.
        Ok(axum::Json(
            serde_json::json!({ "transactionHash": hash, "decryptionKey": hex::encode(key) }),
        ))
    }
}

#[tracing::instrument(level = "debug", skip_all)]
async fn tx_sender(
    mut next_nonce: concordium_rust_sdk::types::Nonce,
    mut channel: tokio::sync::mpsc::Receiver<(
        concordium_rust_sdk::types::Nonce,
        BlockItem<EncodedPayload>,
    )>,
    mut client: v2::Client,
) {
    let num_retries: u32 = 3;
    let mut buffer = BTreeMap::new();
    while let Some((nonce, bi)) = channel.recv().await {
        if next_nonce == nonce {
            next_nonce.next_mut();
            if let Err(e) = client.send_block_item(&bi).await {
                tracing::warn!("Unable to send transaction: {e:#}");
                if !e.is_invalid_argument() && !e.is_duplicate() {
                    // insert for retry;
                    buffer.insert(nonce, (bi, num_retries));
                } else {
                    tracing::error!("Unable to send transaction. Aborting: {e:#}");
                    return;
                }
            } else {
                tracing::debug!("Sent transaction with hash {}", bi.hash());
            }
        } else {
            buffer.insert(nonce, (bi, num_retries));
        }
        while let Some(entry) = buffer.first_entry() {
            if entry.key() == &next_nonce {
                let (nonce, (tx, retries_left)) = entry.remove_entry();
                if let Err(e) = client.send_block_item(&tx).await {
                    tracing::warn!("Unable to send transaction: {e:#}");
                    if retries_left == 0 {
                        tracing::error!("No more retries left. Aborting");
                        return;
                    } else {
                        buffer.insert(nonce, (tx, retries_left.saturating_sub(1)));
                    }
                } else {
                    tracing::debug!("Sent transaction with hash {}", tx.hash());
                }
            }
        }
    }
}

/// The parameter for the contract function `mint` which mints a number of
/// tokens to a given address.
#[derive(smart_contracts::common::Serial, smart_contracts::common::Deserial)]
struct ContractMintParams {
    /// Owner of the newly minted token.
    owner:    AccountAddress,
    /// Platform associated with the newly minted token.
    platform: SupportedPlatform,
    /// The data, which includes the proof, challenge, name, social media URL
    /// (e.g linkedin URL).
    #[concordium(size_length = 2)]
    data:     Vec<u8>,
}

#[derive(Debug, thiserror::Error)]
/// Possible errors returned by any of the endpoints.
pub enum Error {
    #[error("Pool error")]
    PoolError(#[from] deadpool_postgres::PoolError),
    #[error("Database error")]
    DBError(#[from] tokio_postgres::Error),
    #[error("Invalid request")]
    Invalid,
    #[error("Invalid request: {0}")]
    InvalidRequest(String),
    #[error("Not found")]
    NotFound,
    #[error("Internal invariant violation")]
    Internal,
    #[error("Server is overloaded.")]
    Busy,
}

impl axum::response::IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        let r = match self {
            Error::PoolError(_) => (
                StatusCode::REQUEST_TIMEOUT,
                axum::Json("Server busy.".into()),
            ),
            Error::DBError(e) => (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(e.to_string())),
            Error::Invalid => (
                StatusCode::BAD_REQUEST,
                axum::Json("Invalid request.".into()),
            ),
            Error::InvalidRequest(msg) => (StatusCode::BAD_REQUEST, axum::Json(msg)),
            Error::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json("Invalid request.".into()),
            ),
            Error::NotFound => (
                StatusCode::NOT_FOUND,
                axum::Json("Requested value not found.".into()),
            ),
            Error::Busy => (
                StatusCode::SERVICE_UNAVAILABLE,
                axum::Json("The server is temporarily overloaded. Try later.".into()),
            ),
        };
        r.into_response()
    }
}
