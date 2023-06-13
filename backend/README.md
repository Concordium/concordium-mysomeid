## mysomeid backend and test tools

## Exposed endpoints

- `GET /v1/proof/statement`
  Retrieves the statement to request a proof of. No parameters
  are supported.

- `GET /v1/wallet/txs/:accountAddress` returns a list of tokens in **descending**
  order of minting. The `limit` and `from` parameters are supported, both
  optional. The `from` parameter refers to the `id` of the token minting event
  that is returned with each response. Only `id`'s <= `from` are returned, and
  at most `limit` of them. If `limit` is not supplied, or exceeds `500` at most
  500 results will be returned.

- `GET /v1/proof/challenge` returns the challenge to be used for the proof.
  The `platform` and `userData` parameters are supported. `platform` currently
  has to be set to `li`, and userData is an arbitrary string.

- `POST /v1/proof/verify` verifies the supplied proof (expected in the JSON
  body).

- `POST /v1/proof/nft` initiates the minting process. It expects a JSON body
  with the proof, account and platform, verifies the proof, and submits the
  minting transaction. If successful it returns a JSON object with fields
  `transactionHash` and `decryptionKey`. The latter is needed to decrypt the
  data stored in the contract on the chain and verify a proof.

- `GET /v1/proof/nft/:proofId/:decryptionKey` Looks up the proof from the chain
  and decrypts it using the provided key.

- `GET /v1/proof/validate-proof-url` verifies the proof it extracts from the
  URL. It takes `url`, `firstName`, `lastName`, `platform` and `userData` as
  parameters. The names are the names as they appear in the profile, `platform`
  has to be `li`, and `userData` is the linkedin profile name. The URL is meant
  to be in the format `$BASE/:tokenId/:decryptionKey` where `tokenId` is a u64
  (represented as a number), and decryption key is base64 encoded (and then URI
  encoded if necessary). The response is a JSON object with `status` and `id`,
  which is the proof id. `status` is either `valid` or `invalid`. In case of
  failure to get the proof or decrypt it a non-200 status code is returned with
  a short description of the problem.

- `GET /v1/proof/validate` (same as the previous endpoint)

- `GET /v2/proof/validate` same as the previous endpoint, except that it takes
  the full name `name` instead of `firstName` and `lastName`.

- `GET /v1/names/match` takes `so_me_name` and `id_name` as parameters and
  performs fuzzy matching. The response is a JSON object with entires
  `matching`and `intervals`. The former is `true` or `false` indicating whether
  `so_me_name` matches the requirements for a valid social media name for ID
  name `id_name`. If `matching` is `true`, `intervals` contains a list of
  intervals of all words in `so_me_name` that match words in `id_name`, as
  pairs of start byte offset in `so_me_name` (inclusive) and end byte offset
  (exclusive), where the byte offsets are relative to UTF-8 encoding.

- `GET /v1/proof/meta/:proofId` takes a proof id and `p=li` and `r` query
  parameters. It returns token metadata in the format expected for CIS2 token metadata.

- `GET /v1/proof/img/:proofId` takes `r` parameter which should be non-zero for
  revoked tokens. It returns the token image.

- `GET /v1/qr/validate` takes a `url` query parameter which should be a valid
  URL. It downloads an image from the URL and attempts to find and scan the QR
  code in it. If the image cannot be processed then an invalid request status code
  is returned. Otherwise a JSON object is returned with a `result` field. This
  is either `null` if no QR code could be read, or a string which contains the
  decoded contents of the code.

- `GET /v1/qr/image/scan` (same as `v1/qr/validate`).

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
