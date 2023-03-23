# MYSOME.id

## Environment variables

### Web app

REACT_APP_FORCE_IOS: debug flag to tell it we are on mobile.
REACT_APP_CONTRACT_INDEX: index of contract ( defaults to 3330 currently )
REACT_APP_EXPLORER_URL: Should be configured to point to the concordium explorer url; defaults to https://wallet-proxy.testnet.concordium.com.
PUBLIC_URL: Should be '/'.
REACT_APP_SERVICE_BASE: defaults to localhost but should be something like https://api.mysomeid.dev/v1.
REACT_APP_EXTENTION_URL: should be something like https://chrome.google.com/webstore/detail/mozbar/.eakacpaijcpapndcfffdgphdiccmpknp (but for mysome extensino when published)
REACT_APP_BASE_URL: should be sometihng like https://app.mysomeid.dev ( defaults to https://app.mysomeid.dev ).
REACT_APP_STORE_URL: apple app store url.
REACT_APP_PLAY_URL: google play url.
REACT_URL_HANDLER_BASE: should be "mysome:".
REACT_APP_CCD_SCAN_BASE_URL: ccd scan url (defaults to https://testnet.ccdscan.io/).

### Service 

CCD_NODE: should be the url of a ccd node (defaults to http://146.190.94.164:20001).
SCRAPER_BASE_URL: local url to scarper API such as http://scraper:3003.
CONTRACT_INDEX: index of contract (defaults to 3330).
PROOF_NFT_IMAGE_BASE_URL: base url of where the nft image can be (defaults to https://app.mysomeid.dev).
CCD_JSON_RPC_URL: defaults to testnet ( https://json-rpc.testnet.concordium.com).

### Scraper

ACCESS_TOKEN: Access token to Bright Data API.
COLLECTOR: Collector id of Scraper Collector in Bright data setup.
SCRAPER_PORT: The port the Webservice runs on.
