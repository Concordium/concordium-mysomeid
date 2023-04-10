use anyhow::Context;
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    headers::ContentType,
    http::StatusCode,
    TypedHeader,
};
use axum_prometheus::PrometheusMetricLayerBuilder;
use clap::Parser;
use concordium::{
    common::{Versioned, VERSION_0},
    id::{
        constants::{ArCurve, AttributeKind},
        id_proof_types::{Proof, Statement},
        types::{AccountCredentialWithoutProofs, GlobalContext},
    },
    smart_contracts::common::AccountAddress,
    types::CredentialRegistrationID,
    v2::BlockIdentifier,
};
use concordium_rust_sdk as concordium;
use image::GenericImageView;
use postgres_types::FromSql;
use reqwest::Url;
use sha2::Digest;
use std::{borrow::Cow, path::PathBuf, sync::Arc};
use tokio_postgres::NoTls;
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
    pub crypto_params:     Arc<GlobalContext<ArCurve>>,
    pub base_url:          Arc<Url>,
    pub statement:         Arc<Statement<ArCurve, AttributeKind>>,
    pub nft_image:         Bytes,
    pub nft_image_revoked: Bytes,
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

    let db = Database::new(app.db_config, app.max_pool_size).await?;

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

    // TODO: Add limits
    let client = reqwest::ClientBuilder::new()
        .connect_timeout(std::time::Duration::from_secs(2))
        .build()
        .context("Unable to build network client.")?;

    let state = ServiceState {
        concordium_client,
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
        client,
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
type ProofId = String;

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
    // TODO: ProofId should not be a string. It should be a base64
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
    // TODO: We might want to add versioning to the endpoints, so add v1/ to the
    // path.
    base.set_path(&format!("proof/{proof_id}/img"));
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
    #[serde(rename = "t")]
    variant:  ImageVariant,
    #[serde(rename = "p")]
    platform: SupportedPlatform,
    #[serde(rename = "r")]
    revoked:  u8,
}

#[tracing::instrument(level = "debug", skip_all)]
/// Get the NFT image.
/// TODO: This currently returns the same image for everything. It ignores all
/// parameters apart from "revoked".
async fn get_img(
    // TODO: ProofId should not be a string. It should be a base64
    Path(proof): Path<ProofId>,
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
                return Ok(axum::Json(serde_json::json!({ "result": Some(v)})));
            }
            Err(e) => {
                tracing::debug!("Not a UTF8 string in the code: {e}");
            }
        }
    }
    return Ok(axum::Json(serde_json::json!({"result": None::<String>})));
}

#[derive(Debug, serde::Deserialize)]
#[repr(u32)]
enum SupportedPlatform {
    #[serde(rename = "li")]
    LinkedIn,
}

impl std::fmt::Display for SupportedPlatform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SupportedPlatform::LinkedIn => f.write_str("li"),
        }
    }
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChallengeParams {
    platform:  SupportedPlatform,
    user_data: String,
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
        "challenge": hex::encode(hasher.finalize())
    })
    .into()
}

#[derive(serde::Deserialize, Debug, Clone)]
pub struct ProofWithContext {
    pub credential: CredentialRegistrationID,
    pub proof:      Versioned<Proof<ArCurve, AttributeKind>>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyParams {
    account:   AccountAddress,
    proof:     ProofWithContext,
    challenge: String,
}

/// Get the statement
#[tracing::instrument(level = "debug", skip_all)]
async fn verify_proof(
    State(ServiceState {
        mut concordium_client,
        crypto_params,
        statement,
        ..
    }): State<ServiceState>,
    axum::Json(VerifyParams {
        account,
        proof,
        challenge,
    }): axum::Json<VerifyParams>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    let challenge = hex::decode(challenge).map_err(|e| Error::InvalidRequest(e.to_string()))?;
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
        &challenge,
        &crypto_params,
        proof.credential.as_ref(),
        &commitments,
        &proof.proof.value,
    );
    Ok(axum::Json(serde_json::json!({ "result": result })))
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
        };
        r.into_response()
    }
}

#[derive(Debug, thiserror::Error)]
#[error("Unexpected data size.")]
struct IncorrectLength;

/// A helper to parse fixed length byte arrays from the database.
struct Fixed<const N: usize>(pub [u8; N]);

impl<'a, const N: usize> FromSql<'a> for Fixed<N> {
    fn from_sql(
        ty: &postgres_types::Type,
        raw: &'a [u8],
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        let v = <&[u8] as FromSql>::from_sql(ty, raw)?;
        Ok(Fixed(v.try_into().map_err(|_| Box::new(IncorrectLength))?))
    }

    fn accepts(ty: &postgres_types::Type) -> bool { <&[u8] as FromSql>::accepts(ty) }
}

#[derive(Clone)]
pub struct Database {
    pool:                deadpool_postgres::Pool,
    prepared_statements: Arc<QueryStatements>,
}

impl Database {
    pub async fn new(config: tokio_postgres::Config, pool_size: usize) -> anyhow::Result<Self> {
        let manager_config = deadpool_postgres::ManagerConfig {
            recycling_method: deadpool_postgres::RecyclingMethod::Verified,
        };
        let manager = deadpool_postgres::Manager::from_config(config, NoTls, manager_config);
        let pool = deadpool_postgres::Pool::builder(manager)
            .create_timeout(Some(std::time::Duration::from_secs(5)))
            .recycle_timeout(Some(std::time::Duration::from_secs(5)))
            .wait_timeout(Some(std::time::Duration::from_secs(5)))
            .max_size(pool_size)
            .runtime(deadpool_postgres::Runtime::Tokio1)
            .build()?;
        Ok(Self {
            pool,
            prepared_statements: Arc::new(QueryStatements::new()),
        })
    }
}

struct QueryStatements {
    concordium_tx_status:        (String, tokio_postgres::types::Type),
    withdrawal_status:           (String, tokio_postgres::types::Type),
    get_event:                   (String, [tokio_postgres::types::Type; 2]),
    get_merkle_leafs:            String,
    get_withdrawals_for_address: (String, tokio_postgres::types::Type),
    get_deposits_for_address:    (String, tokio_postgres::types::Type),
    list_tokens:                 String,
    get_next_merkle_root:        String,
}

impl QueryStatements {
    pub fn new() -> Self {
        let concordium_tx_status = (
            "SELECT tx_hash FROM ethereum_deposit_events WHERE origin_tx_hash = $1".into(),
            tokio_postgres::types::Type::BYTEA,
        );
        let withdrawal_status = (
            "SELECT processed, root, event_index FROM concordium_events WHERE tx_hash = $1".into(),
            tokio_postgres::types::Type::BYTEA,
        );
        let get_event = (
            "SELECT event_data, processed FROM concordium_events WHERE tx_hash = $1 AND \
             event_index = $2"
                .into(),
            [
                tokio_postgres::types::Type::BYTEA,
                tokio_postgres::types::Type::INT8,
            ],
        );
        let get_merkle_leafs = "SELECT tx_hash, event_merkle_hash FROM concordium_events WHERE \
                                root IN (SELECT root FROM merkle_roots ORDER BY id DESC LIMIT 1) \
                                ORDER BY event_index ASC"
            .into();
        let get_withdrawals_for_address = (
            "SELECT insert_time, processed, tx_hash, child_index, child_subindex, amount, \
             event_index FROM concordium_events WHERE event_type = 'withdraw' AND receiver = $1"
                .into(),
            tokio_postgres::types::Type::BYTEA,
        );
        let get_deposits_for_address = (
            "SELECT insert_time, tx_hash, root_token, tx_hash, amount, origin_tx_hash, \
             origin_event_index FROM ethereum_deposit_events WHERE depositor = $1"
                .into(),
            tokio_postgres::types::Type::BYTEA,
        );
        let list_tokens = "SELECT root, child_index, child_subindex, eth_name, decimals FROM \
                           token_maps ORDER BY id ASC"
            .into();
        let get_next_merkle_root =
            "SELECT expected_time FROM expected_merkle_update WHERE tag = ''".into();
        Self {
            concordium_tx_status,
            withdrawal_status,
            get_event,
            get_merkle_leafs,
            get_withdrawals_for_address,
            get_deposits_for_address,
            list_tokens,
            get_next_merkle_root,
        }
    }
}
