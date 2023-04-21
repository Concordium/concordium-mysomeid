// TODO:
// - Documentation.
// - Resend stored transactions.
// - Do we need to support the order for transaction list?
// -
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
use backend::*;
use clap::Parser;
use concordium::{
    base as concordium_base, cis2,
    common::{self, VERSION_0},
    id::{
        constants::{ArCurve, AttributeKind},
        id_proof_types::Statement,
        types::AccountCredentialWithoutProofs,
    },
    smart_contracts::{self, common::AccountAddress},
    types::{
        queries::BlockInfo, AbsoluteBlockHeight, AccountIndex, BlockItemSummary, ContractAddress,
        CryptographicParameters, Energy, WalletAccount,
    },
    v2::{self, BlockIdentifier, QueryError},
};
use concordium_base::{
    contracts_common::Amount,
    smart_contracts::{OwnedParameter, OwnedReceiveName},
    transactions::{self, BlockItem, EncodedPayload, UpdateContractPayload},
};
use concordium_rust_sdk as concordium;
use futures::{StreamExt, TryStreamExt};
use image::{DynamicImage, GenericImageView};
use rand::Rng;
use reqwest::Url;
use sha2::Digest;
use std::{
    collections::{BTreeMap, HashMap},
    io::Read,
    path::PathBuf,
    str::FromStr,
    sync::Arc,
};
use tokio::sync::mpsc::error::TrySendError;
use tonic::transport::ClientTlsConfig;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse};

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Api {
    #[clap(
        long = "concordium-api",
        name = "concordium-api",
        help = "GRPC V2 interface of the Concordium node.",
        env = "MYSOMEID_CONCORDIUM_API",
        default_value = "http://localhost:20000"
    )]
    api: concordium::v2::Endpoint,
    /// Request timeout for Concordium node requests.
    #[clap(
        long,
        help = "Timeout for requests to the Concordium node.",
        env = "MYSOMEID_CONCORDIUM_REQUEST_TIMEOUT",
        default_value = "10"
    )]
    concordium_request_timeout: u64,
    /// Location of the keys used to send transactions.
    #[clap(long, help = "Path to the key file.", env = "MYSOMEID_WALLET")]
    concordium_wallet: std::path::PathBuf,
    /// Address of the mysomeid contract.
    #[clap(
        long,
        help = "Address of the instance of mysomeid..",
        env = "MYSOMEID_CONTRACT"
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
        env = "MYSOMEID_LOG_LEVEL"
    )]
    log_level: tracing_subscriber::filter::LevelFilter,
    #[clap(
        long = "db",
        default_value = "host=localhost dbname=mysomeid user=postgres password=password port=5432",
        help = "Database connection string.",
        env = "MYSOMEID_DB_STRING"
    )]
    db_config: tokio_postgres::Config,
    #[clap(
        long = "listen-address",
        default_value = "0.0.0.0:8080",
        help = "Listen address for the server.",
        env = "MYSOMEID_LISTEN_ADDRESS"
    )]
    listen_address: std::net::SocketAddr,
    #[clap(
        long = "prometheus-address",
        help = "Listen address for the server.",
        env = "MYSOMEID_PROMETHEUS_ADDRESS"
    )]
    prometheus_address: Option<std::net::SocketAddr>,
    #[clap(
        long = "max-pool-size",
        default_value = "16",
        help = "Maximum size of a database connection pool.",
        env = "MYSOMEID_MAX_DB_CONNECTION_POOL_SIZE"
    )]
    max_pool_size: usize,
    #[clap(
        long = "request-timeout",
        default_value = "1000",
        help = "Request timeout in millisecons.",
        env = "MYSOMEID_REQUEST_TIMEOUT"
    )]
    request_timeout: u64,
    #[clap(
        long = "log-headers",
        help = "Whether to log headers for requests and responses.",
        env = "MYSOMEID_LOG_HEADERS"
    )]
    log_headers: bool,
    #[clap(
        long = "https-only-download",
        help = "Only allow HTTPS requests when downloading images.",
        env = "MYSOMEID_HTTPS_ONLY"
    )]
    https_only: bool,
    #[clap(
        long = "concordium-max-parallel",
        help = "Maximum number of parallel queries of the Concordium node. This is only useful in \
                initial catchup if the service is started a long time after the contracts are in \
                operation.",
        env = "MYSOMEID_MAX_PARALLEL_QUERIES_CONCORDIUM",
        default_value = "1"
    )]
    max_parallel: u32,
    // Maximum number of seconds a concordium node can be behind before it is deemed "behind".
    #[clap(
        long = "concordium-max-behind",
        help = "Maximum number of seconds the Concordium node's last finalized block can be \
                behind before we log warnings.",
        env = "MYSOMEID_CONCORDIUM_MAX_BEHIND",
        default_value = "240"
    )]
    max_behind: u32,
    #[clap(
        long = "max-daily-mints",
        help = "Maximum number of sponsored mint transactions per day per account.",
        env = "MYSOMEID_MAX_DAILY_MINTS",
        default_value = "5"
    )]
    max_daily_mints: u32,
    #[clap(
        long = "allowed-domains",
        help = "Allowed domains for image requests.",
        env = "MYSOMEID_ALLOWED_DOMAINS"
    )]
    allowed_domains: Vec<String>,
}

#[derive(Debug, Clone)]
struct ServiceState {
    pub client:                reqwest::Client,
    pub concordium_client:     concordium::v2::Client,
    pub crypto_params:         Arc<CryptographicParameters>,
    pub base_url:              Arc<Url>,
    pub statement:             Arc<Statement<ArCurve, AttributeKind>>,
    pub nft_image:             Bytes,
    pub nft_image_revoked:     Bytes,
    pub signer:                Arc<WalletAccount>,
    pub contract_address:      ContractAddress,
    // We deliberately use a mutex here instead of an atomicu64.
    // We use the mutex for synchronization of other actions to make sure
    // that we don't skip nonces in case of other failures, such as failure to send a transaction.
    pub nonce_counter:         Arc<tokio::sync::Mutex<concordium::types::Nonce>>,
    pub tx_sender:             tokio::sync::mpsc::Sender<TxChannelData>,
    pub read_db:               db::ReadDatabase,
    pub max_daily_mints:       u32,
    pub allowed_domains:       Arc<Vec<String>>,
    pub allowed_substitutions: Arc<HashMap<char, Vec<String>>>,
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

    let (start_height, next_id, db) = db::Database::new(&app.db_config).await?;

    let read_db = db::ReadDatabase::new(app.db_config.clone(), app.max_pool_size).await?;

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

    let signer =
        WalletAccount::from_json_file(app.concordium_wallet).context("Unable to read keys.")?;

    let sender_account = signer.address;

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
        .redirect(reqwest::redirect::Policy::limited(3))
        .timeout(std::time::Duration::from_secs(5)) // from initial connection until processing the body has finished.
        .https_only(app.https_only)
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
        nonce_counter: Arc::new(tokio::sync::Mutex::new(starting_nonce.nonce)),
        tx_sender: sender,
        read_db,
        max_daily_mints: app.max_daily_mints,
        allowed_domains: Arc::new(app.allowed_domains),
        allowed_substitutions: Arc::new(get_allowed_substitutions()),
    };

    let (db_sender, db_receiver) = tokio::sync::mpsc::channel(100);
    let (stop_sender, mut stop_receiver) = tokio::sync::watch::channel(());
    let (died_sender, died_receiver) = tokio::sync::broadcast::channel(10);

    let shutdown_handler_handle = spawn_cancel(
        died_sender.clone(),
        set_shutdown(stop_sender, died_receiver),
    );

    let db_handle = spawn_cancel(
        died_sender.clone(),
        db::handle_database(
            app.db_config,
            db,
            next_id,
            app.concordium_contract,
            db_receiver,
            stop_receiver.clone(),
        ),
    );

    let starting_height = if let Some(sh) = start_height {
        sh
    } else {
        concordium_client
            .find_instance_creation(.., app.concordium_contract)
            .await?
            .0
    };

    let watcher_handle = spawn_cancel(
        died_sender.clone(),
        listen_concordium(
            concordium_client.clone(),
            db_sender.clone(),
            starting_height,
            app.max_parallel,
            app.max_behind,
            sender_account,
        ),
    );

    // build our application with a route
    let api = axum::Router::new()
        .route(
            "/v1/proof/statement",
            axum::routing::get(get_statement),
        )
        .route(
            "/v1/wallet/txs/:accountAddress",
            axum::routing::get(get_events),
        )
        .route(
            "/v1/proof/challenge",
            axum::routing::get(get_challenge),
        )
        .route(
            "/v1/proof/verify",
            axum::routing::post(verify_proof),
        )
        .route(
            "/v1/proof/nft",
            axum::routing::post(mint_nft),
        )
        .route(
            "/v1/proof/nft/:proofId/:decryptionKey",
            axum::routing::get(get_proof),
        )
        .route(
            "/v1/proof/validate-proof-url",
            axum::routing::get(validate_proof),
        )
        .route(
            "/v1/proof/validate",
            axum::routing::get(validate_proof),
        )
        .route(
            "/v1/proof/meta/:proof",
            axum::routing::get(get_metadata),
        )
        .route(
            "/v1/proof/img/:proof",
            axum::routing::get(get_img),
        )
        .route(
            "/v1/qr/validate",
            axum::routing::get(parse_qr),
        )
        .route(
            "/v1/qr/image/scan", // TODO: This is duplicate, there is no point in this.
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
        .layer(tower_http::limit::RequestBodyLimitLayer::new(16_386)) // 16kB bodies is plenty for the proofs we need.
        .layer(tower_http::cors::CorsLayer::permissive().allow_methods([http::Method::GET, http::Method::POST]))
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
        spawn_cancel(died_sender.clone(), async move {
            axum::Server::bind(&prometheus_address)
                .serve(prometheus_api.into_make_service())
                .await
                .context("Unable to start Prometheus server.")?;
            Ok::<(), anyhow::Error>(())
        });
    }

    let tx_sender_handle = spawn_cancel(
        died_sender.clone(),
        tx_sender(starting_nonce.nonce, receiver, db_sender, concordium_client),
    );

    // run our app with hyper
    tracing::debug!("listening on {}", app.listen_address);
    let mut stop_receiver_server = stop_receiver.clone();
    axum::Server::bind(&app.listen_address)
        .serve(api.into_make_service())
        .with_graceful_shutdown(async move {
            if let Err(e) = stop_receiver_server.changed().await {
                tracing::error!("A service has crashed: {e:#}");
            }
        })
        .await
        .context("Unable to start server.")?;

    // Wait for signal to be received.
    if let Err(e) = stop_receiver.changed().await {
        log::error!("The signal handler unexpectedly died with {e}. Shutting off the service.");
    }

    watcher_handle.abort();
    // And wait for all of them to terminate.
    let shutdown = [
        await_and_report("database handler", db_handle),
        await_and_report("transaction sender", tx_sender_handle),
    ];
    shutdown
        .into_iter()
        .collect::<futures::stream::FuturesUnordered<_>>()
        .collect::<()>()
        .await;
    await_and_report("shutdown handler", shutdown_handler_handle).await;
    drop(died_sender); // keep the sender alive until here explicitly so that we don't have spurious
                       // errors when the last task is dying.

    Ok(())
}

#[tracing::instrument(level = "debug")]
/// Get the statement
async fn get_statement(
    State(ServiceState { statement, .. }): State<ServiceState>,
) -> axum::Json<serde_json::Value> {
    serde_json::json!({ "statement": &*statement }).into()
}

/// Proof id is the token id generated by the contract when minting.
type ProofId = u64;

#[derive(Debug, serde::Deserialize)]
struct MetadataQueryParams {
    #[serde(rename = "p")]
    platform: SupportedPlatform,
    #[serde(rename = "r")]
    revoked:  u8,
}
#[tracing::instrument(level = "debug", skip_all)]
/// Get the metadata of a token/proof.
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
    State(ServiceState {
        client,
        allowed_domains,
        ..
    }): State<ServiceState>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    if let Some(domain) = url.domain() {
        if !allowed_domains.is_empty() && allowed_domains.iter().all(|ad| ad != domain) {
            tracing::warn!("Disallowed domain requested: {domain}");
            return Err(Error::InvalidRequest(
                "Requesting an image from a non white-listed domain.".into(),
            ));
        }
    } else {
        return Err(Error::InvalidRequest("URL must have a domain name.".into()));
    }
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
    parse_qr_from_image(img)
}

fn parse_qr_from_image(img: DynamicImage) -> Result<axum::Json<serde_json::Value>, Error> {
    // pre-process image
    let img = img.resize_exact(1600, 400, image::imageops::FilterType::Gaussian);

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
fn get_token_id_and_key(url: &Url) -> Option<(u64, DecryptionKey)> {
    let mut path_segments = url.path_segments()?.rev();
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
        allowed_substitutions,
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
    match fuzzy_match_names(
        &first_name,
        &last_name,
        proof.private.first_name.0.as_str(),
        proof.private.surname.0.as_str(),
        &allowed_substitutions,
    ) {
        Ok(true) => (),
        Ok(false) => {
            return Ok(axum::Json(
                serde_json::json!({"status": "invalid", "id": token_id}),
            ));
        }
        Err(_) => return Err(Error::Invalid),
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

/// The symmetric encryption means encryption and decryption keys are the same.
/// But in some context we should think of it as encryption, and in some as
/// decryption key. This alias is for those documentation purposes.
type DecryptionKey = EncryptionKey;

impl std::fmt::Debug for EncryptionKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(String::from(*self).as_str())
    }
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
    Path((token_id, key)): Path<(ProofId, EncryptionKey)>,
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

#[derive(serde::Deserialize)]
struct GetEventsParams {
    limit: Option<u32>,
    from:  Option<i64>,
}

#[tracing::instrument(level = "debug", skip_all)]
async fn get_events(
    Path(address): Path<AccountAddress>,
    Query(GetEventsParams { limit, from }): Query<GetEventsParams>,
    State(ServiceState { read_db, .. }): State<ServiceState>,
) -> Result<axum::Json<serde_json::Value>, Error> {
    let effective_limit = limit.map_or(500, |x| std::cmp::min(500, x));
    match read_db.get_events(address, from, effective_limit).await {
        Ok(events) => Ok(axum::Json(serde_json::json!({
            "limit": effective_limit,
            "events": events
        }))),
        Err(e) => {
            tracing::error!("Error retrieving events: {e:#}");
            Err(Error::Internal)
        }
    }
}

#[tracing::instrument(level = "debug", skip(concordium_client, contract_address))]
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
pub struct GetProofResponse {
    pub id:       ProofId,
    pub owner:    AccountAddress,
    pub platform: SupportedPlatform,
    pub revoked:  bool,
    #[serde(flatten)]
    pub private:  PrivateTokenData,
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
        read_db,
        max_daily_mints,
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

    let (aux_data, key) = {
        let mut rng = rand::thread_rng();

        // We have verified the request. Now we mint.
        let key = Aes256Gcm::generate_key(&mut rng);
        let cipher = Aes256Gcm::new(&key);
        let nonce = rng.gen::<[u8; 12]>();
        drop(rng);
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
        (aux_data, key.into())
    };

    let mint_params = ContractMintParams {
        owner: account,
        platform,
        data: aux_data,
    };

    let update_payload = UpdateContractPayload {
        amount:       Amount::zero(),
        address:      contract_address,
        receive_name: OwnedReceiveName::new_unchecked("mysomeid.mint".into()),
        // TODO: Log error.
        message:      OwnedParameter::from_serial(&mint_params).map_err(|_| Error::Internal)?,
    };

    // now we need to actually mint.
    // First make the transaction.
    let mut nonce_counter = nonce_counter.lock().await;

    // We only check this here after acquiring the lock. If we do it before we don't
    // have guarantees due to parallel requests.
    match read_db
        .get_num_submitted_last_day(account_info.account_index)
        .await
    {
        Ok(num) => {
            if num > max_daily_mints.into() {
                tracing::warn!("Too many daily requests from {}.", account);
                return Err(Error::TooManyRequest);
            }
        }
        Err(e) => {
            tracing::error!("Error querying database: {e:#}");
            return Err(Error::Internal);
        }
    }

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
    let (sender, receiver) = tokio::sync::oneshot::channel();
    if let Err(e) = tx_sender.try_send(TxChannelData {
        nonce: *nonce_counter,
        response: sender,
        sponsoree: account_info.account_index,
        bi,
    }) {
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

        if receiver.await.is_err() {
            // This means that the transaction sender task is dead. We return
            // internalserver error.
            tracing::error!("Unable to enqueue transaction since the transaction sender is dead.");
            return Err(Error::Internal);
        }

        Ok(axum::Json(
            serde_json::json!({ "transactionHash": hash, "decryptionKey": EncryptionKey{key} }),
        ))
    }
}

struct TxChannelData {
    nonce:     concordium_rust_sdk::types::Nonce,
    response:  tokio::sync::oneshot::Sender<()>,
    bi:        BlockItem<EncodedPayload>,
    sponsoree: AccountIndex,
}

#[tracing::instrument(level = "debug", skip_all)]
async fn tx_sender(
    mut next_nonce: concordium_rust_sdk::types::Nonce,
    mut channel: tokio::sync::mpsc::Receiver<TxChannelData>,
    db_sender: tokio::sync::mpsc::Sender<db::DatabaseOperation>,
    mut client: v2::Client,
) -> anyhow::Result<()> {
    let num_retries: u32 = 3;
    let mut buffer = BTreeMap::new();
    while let Some(TxChannelData {
        nonce,
        response,
        bi,
        sponsoree,
    }) = channel.recv().await
    {
        db_sender
            .send(db::DatabaseOperation::InsertTransaction {
                sponsoree,
                tx_hash: bi.hash(),
                tx: bi.clone(),
                response,
            })
            .await
            .ok()
            .context("Database connection died. Stopping transaction sender.")?;
        if next_nonce == nonce {
            next_nonce.next_mut();
            if let Err(e) = client.send_block_item(&bi).await {
                tracing::warn!("Unable to send transaction: {e:#}");
                if !e.is_invalid_argument() && !e.is_duplicate() {
                    // insert for retry;
                    buffer.insert(nonce, (bi, num_retries));
                } else {
                    tracing::error!("Unable to send transaction. Aborting: {e:#}");
                    return Err(e.into());
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
                        return Err(e.into());
                    } else {
                        buffer.insert(nonce, (tx, retries_left.saturating_sub(1)));
                    }
                } else {
                    tracing::debug!("Sent transaction with hash {}", tx.hash());
                }
            }
        }
    }
    Ok(())
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
    #[error("Too many requests in the last day.")]
    TooManyRequest,
}

impl axum::response::IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        let r = match self {
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
            Error::TooManyRequest => (
                StatusCode::TOO_MANY_REQUESTS,
                axum::Json("Too many mint requests in the last day.".into()),
            ),
        };
        r.into_response()
    }
}

/// Construct a future for shutdown signals (for unix: SIGINT and SIGTERM) (for
/// windows: ctrl c and ctrl break). The signal handler is set when the future
/// is polled and until then the default signal handler.
async fn set_shutdown(
    stop_sender: tokio::sync::watch::Sender<()>,
    mut task_died: tokio::sync::broadcast::Receiver<()>,
) -> anyhow::Result<()> {
    #[cfg(unix)]
    {
        use tokio::signal::unix as unix_signal;
        let mut terminate_stream = unix_signal::signal(unix_signal::SignalKind::terminate())?;
        let mut interrupt_stream = unix_signal::signal(unix_signal::SignalKind::interrupt())?;
        let terminate = Box::pin(terminate_stream.recv());
        let interrupt = Box::pin(interrupt_stream.recv());
        let task_died = Box::pin(task_died.recv());
        futures::future::select(task_died, futures::future::select(terminate, interrupt)).await;
        if stop_sender.send(()).is_err() {
            log::error!("Unable to send stop signal.");
        }
    }
    #[cfg(windows)]
    {
        use tokio::signal::windows as windows_signal;
        let mut ctrl_break_stream = windows_signal::ctrl_break()?;
        let mut ctrl_c_stream = windows_signal::ctrl_c()?;
        let ctrl_break = Box::pin(ctrl_break_stream.recv());
        let ctrl_c = Box::pin(ctrl_c_stream.recv());
        let task_died = Box::pin(task_died.recv());
        futures::future::select(task_died, futures::future::select(ctrl_break, ctrl_c)).await;
        if stop_sender.send(()).is_err() {
            log::error!("Unable to send stop signal.");
        }
    }
    Ok(())
}

/// Like `tokio::spawn` but the provided future is modified so that
/// once it terminates it sends a message on the provided channel.
/// This is sent regardless of how the future terminates, as long as it
/// terminates normally (i.e., does not panic).
fn spawn_cancel<T>(
    died_sender: tokio::sync::broadcast::Sender<()>,
    future: T,
) -> tokio::task::JoinHandle<T::Output>
where
    T: futures::Future + Send + 'static,
    T::Output: Send + 'static, {
    tokio::spawn(async move {
        let res = future.await;
        // We ignore errors here since this always happens at the end of a task.
        // Since we keep one receiver alive until the end of the `main` function
        // the error should not happen anyhow.
        let _ = died_sender.send(());
        res
    })
}

#[derive(Debug, thiserror::Error)]
pub enum NodeError {
    /// No finalization in some time.
    #[error("Timeout.")]
    Timeout,
    /// Query error.
    #[error("Error querying the node {0}.")]
    QueryError(#[from] v2::QueryError),
    /// Internal error. This is a configuration issue.
    #[error("Internal error: {0}.")]
    Internal(anyhow::Error),
}

/// Return Err if querying the node failed.
/// Return Ok(()) if the channel to the database was closed.
async fn listen_concordium_worker(
    // The client used to query the chain.
    client: &mut v2::Client,
    // A channel used to insert into the database.
    sender: &tokio::sync::mpsc::Sender<db::DatabaseOperation>,
    // Height at which to start querying.
    height: &mut AbsoluteBlockHeight, // start height
    // Maximum number of parallel queries to make. This speeds up initial catchup.
    max_parallel: u32,
    // Maximum number of seconds to wait for a new finalized block.
    max_behind: u32,
    sender_account: AccountAddress,
) -> Result<(), NodeError> {
    let mut finalized_blocks = client.get_finalized_blocks_from(*height).await?;
    let timeout = std::time::Duration::from_secs(max_behind.into());
    loop {
        let (error, chunk) = finalized_blocks
            .next_chunk_timeout(max_parallel as usize, timeout)
            .await
            .map_err(|_| NodeError::Timeout)?;
        let mut futures = futures::stream::FuturesOrdered::new();
        for fb in chunk {
            let mut node = client.clone();
            // A future to query the block at the given hash.
            let poller = async move {
                let binfo = node.get_block_info(fb.block_hash).await?;
                let events = if binfo.response.transaction_count == 0 {
                    Vec::new()
                } else {
                    node.get_block_transaction_events(fb.block_hash)
                        .await?
                        .response
                        .try_collect()
                        .await?
                };
                Ok::<(BlockInfo, Vec<BlockItemSummary>), QueryError>((binfo.response, events))
            };
            futures.push_back(poller);
        }

        while let Some(result) = futures.next().await {
            let (block, summaries) = result?;
            log::debug!(
                "Processing Concordium block {} at height {}",
                block.block_hash,
                block.block_height
            );
            let mut transaction_events = Vec::new();
            for summary in summaries {
                let events = get_cis2_events(&summary);
                if let Some(events) = events {
                    if !events.is_empty() {
                        transaction_events.push((summary.hash, events));
                    }
                }
                // Also check for any other transactions from the sender account.
                // So we can mark transactions we have sent as failed.
                if let Some(acc) = summary.sender_account() {
                    if acc.is_alias(&sender_account) {
                        if sender
                            .send(db::DatabaseOperation::MarkConcordiumTransaction {
                                tx_hash: summary.hash,
                                status:  if summary.is_rejected_account_transaction().is_some() {
                                    db::TransactionStatus::Failed
                                } else {
                                    db::TransactionStatus::Finalized
                                },
                            })
                            .await
                            .is_err()
                        {
                            log::info!("The channel to the database writer has been closed.");
                            return Ok(());
                        }
                    }
                }
            }
            if sender
                .send(db::DatabaseOperation::InsertBlock {
                    block,
                    txs: transaction_events,
                })
                .await
                .is_err()
            {
                log::info!("The channel to the database writer has been closed.");
                return Ok(());
            }
            *height = height.next();
        }
        if error {
            // we have processed the blocks we can, but further queries on the same stream
            // will fail since the stream signalled an error.
            return Err(NodeError::QueryError(v2::QueryError::RPCError(
                v2::Status::unavailable("No more blocks are available to process.").into(),
            )));
        }
    }
}

pub async fn listen_concordium(
    // The client used to query the chain.
    mut client: v2::Client,
    // A channel used to insert into the database.
    sender: tokio::sync::mpsc::Sender<db::DatabaseOperation>,
    // Height at which to start querying.
    mut height: AbsoluteBlockHeight, // start height
    // Maximum number of parallel queries to make. This speeds up initial catchup.
    max_parallel: u32,
    // Maximum number of seconds to wait for a new finalized block.
    max_behind: u32,
    sender_account: AccountAddress,
) -> anyhow::Result<()> {
    let mut retry_attempt = 0;
    let mut last_height = height;
    loop {
        let res = listen_concordium_worker(
            &mut client,
            &sender,
            &mut height,
            max_parallel,
            max_behind,
            sender_account,
        )
        .await;

        // If the last query did something clear the retry counter.
        if height > last_height {
            last_height = height;
            retry_attempt = 0;
        }
        match res {
            Ok(()) => {
                log::info!("Terminated listening for new Concordium events.");
                return Ok(());
            }
            Err(e) => match e {
                NodeError::Timeout => {
                    retry_attempt += 1;
                    if retry_attempt > 6 {
                        log::error!("Too many failures attempting to reconnect. Aborting.");
                        anyhow::bail!("Too many failures attempting to reconnect. Aborting.");
                    }
                    let delay = std::time::Duration::from_secs(5 << retry_attempt);
                    log::warn!(
                        "Querying the node timed out. Will attempt again in {} seconds..",
                        delay.as_secs()
                    );
                    tokio::time::sleep(delay).await;
                }
                NodeError::QueryError(e) => {
                    retry_attempt += 1;
                    if retry_attempt > 6 {
                        log::error!("Too many failures attempting to reconnect. Aborting.");
                        anyhow::bail!("Too many failures attempting to reconnect. Aborting.");
                    }
                    let delay = std::time::Duration::from_secs(5 << retry_attempt);
                    log::warn!(
                        "Querying the node failed due to {:#}. Will attempt again in {} seconds.",
                        e,
                        delay.as_secs()
                    );
                    tokio::time::sleep(delay).await;
                }
                NodeError::Internal(e) => {
                    log::error!("Internal configuration error: {e}. Terminating the query task.");
                    return Err(e);
                }
            },
        };
    }
}

/// Attempt to extract CIS2 events from the block item.
/// If the transaction is a smart contract init or update transaction then
/// attempt to parse the events as CIS2 events. If any of the events fail
/// parsing then the logs for that section of execution are ignored, since it
/// indicates an error in the contract.
///
/// The return value of [`None`] means there are no understandable CIS2 logs
/// produced.
fn get_cis2_events(bi: &BlockItemSummary) -> Option<Vec<(ContractAddress, Vec<cis2::Event>)>> {
    match bi.contract_update_logs() {
        Some(log_iter) => Some(
            log_iter
                .flat_map(|(ca, logs)| {
                    match logs
                        .iter()
                        .map(cis2::Event::try_from)
                        .collect::<Result<Vec<cis2::Event>, _>>()
                    {
                        Ok(events) => Some((ca, events)),
                        Err(_) => None,
                    }
                })
                .collect(),
        ),
        None => {
            let init = bi.contract_init()?;
            let cis2 = init
                .events
                .iter()
                .map(cis2::Event::try_from)
                .collect::<Result<Vec<cis2::Event>, _>>()
                .ok()?;
            Some(vec![(init.address, cis2)])
        }
    }
}

/// Await the task to terminate. When terminated, if it raised an error,
/// report it together with the `descr` of the task.
async fn await_and_report<E: std::fmt::Display>(
    descr: &str,
    handle: tokio::task::JoinHandle<Result<(), E>>,
) {
    match handle.await {
        Ok(Ok(())) => {
            log::info!("Task {descr} terminated.");
        }
        Ok(Err(e)) => {
            log::error!("Task {descr} unexpectedly stopped due to {e:#}.");
        }
        Err(e) => {
            if e.is_panic() {
                log::error!("Task panicked.");
            } else if e.is_cancelled() {
                log::info!("Task {descr} was cancelled.");
            } else {
                log::error!("Task {descr} unexpectedly closed.");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    /// Try reading hard-to-read QR code from image
    fn test_difficult_reading() {
        let img = image::open("./resources/hard-to-read.jpg").unwrap();
        let result = parse_qr_from_image(img).unwrap();
        let result_string = result.to_string();
        let expected_result = "{\"result\":\"https://mysomeid.com/v?i=0U8Qzw3CDWc=&k=iYS3HLt0ojTxm37gVlBZ5AkAPXcWdfqFO00_7vAApKc=\"}";

        assert!(result_string == expected_result);
    }
}
