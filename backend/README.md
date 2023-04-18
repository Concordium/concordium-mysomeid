## mysomeid backend and test tools

## Configuration options

The following configuration options are supported

- `--concordium-api` (env `MYSOMEID_CONCORDIUM_API`) is the address of the V2
  interface of the node.

- `--log-level` (env `MYSOMEID_LOG_LEVEL`) is one of the supported log levels
  (`off`, `error`, `warn`, `info`, `debug`, `trace`). The default is `info`.

- `--nft-image` (env `MYSOMEID_NFT_IMAGE`) Path to the PNG nft image for
      non-revoked tokens.

- `--nft-image-revoked` (env `MYSOMEID_NFT_IMAGE_REVOKED`) Path to the PNG nft image for revoked tokens.

- `--db` (env `MYSOMEID_DB_STRING`) Database connection string. Only postgres
  plaintext connection is supported.

- `--base-url` (env `MYSOMEID_BASE_URL`) The base URL where the service is accessible.

- `--concordium-wallet` Path to the key file in either genesis or browser wallet
  export formats. (env: `MYSOMEID_WALLET`)

- `--https-only-download` (env `MYSOMEID_HTTPS_ONLY`)
   Only allow HTTPS requests when downloading images.

- `--max-daily-mints` (env `MYSOMEID_MAX_DAILY_MINTS`) Maximum number of
  sponsored mint transactions per day per account. [default 5]

- `--listen-address` (env `MYSOMEID_LISTEN_ADDRESS`) Listen address for the
  server. [default: 0.0.0.0:8080]

- `--concordium-contract` (env `MYSOMEID_CONTRACT`)
  Address of the instance of mysomeid.

- `--prometheus-address` (env `MYSOMEID_PROMETHEUS_ADDRESS`) Listen address for
  the prometheus server. Setting this will start the built-in prometheus server.

### The following options have sensible defaults but might be changed for
  deployment

- `--concordium-request-timeout` (`MYSOMEID_CONCORDIUM_REQUEST_TIMEOUT`) Timeout
  for requests to the Concordium node.

- `--max-pool-size` (env `MYSOMEID_MAX_DB_CONNECTION_POOL_SIZE`) Maximum size of
  a database connection pool. [default: 16]

- `--request-timeout` (env `MYSOMEID_REQUEST_TIMEOUT`) Request timeout in
      millisecons. [default: 1000]

- `--log-headers` (env `MYSOMEID_LOG_HEADERS`)
  Whether to log headers for requests and responses.

- `--concordium-max-parallel` (env `MYSOMEID_MAX_PARALLEL_QUERIES_CONCORDIUM`)
  Maximum number of parallel queries of the Concordium node. This is only useful
  in initial catchup if the service is started a long time after the contracts
  are in operation. [default: 1]

- `--concordium-max-behind` (env `MYSOMEID_CONCORDIUM_MAX_BEHIND`) Maximum
  number of seconds the Concordium node's last finalized block can be behind
  before we log warnings. [default: 240]


## Building a docker image

There is a [Dockerfile](./scripts/build.Dockerfile). This builds an image with
the server binary called `mysomeid-backend` installed in `/usr/local/bin` inside
the image.

The image can be built with
```
docker build \
    --build-arg build_image=rust:1.67-buster\
    --build-arg base_image=debian:buster\
    -f backend/scripts/build.Dockerfile -t mysomeid:latest .
```
running from the repository root.
