# Getting started with the MYSOME.id web-app project

## Available Scripts

In the project directory, you can run:

### `yarn build`

Builds the web app front-end application for the smart contracts/ecosystem.

### `yarn dev`

Builds the web app front-end application for development with hot-reloading hosted on http://localhost:3000.


## Dependencies

The web app project uses the shared library chrome-ext-shared, which needs to be built before the web app is built.

Refer to the README.md document in the chrome-ext-shared library for various relevant configurations.

## Debugging

When debugging, build the chrome-ext-shared library for development to enable verbose level console logging.

## Run against the public TestNet API

By default, the web app runs against a local MYSOME API running at http://0.0.0.0:8080.

To test against the TestNet API during development, start the web app using the TestNet-configured API deployed at https://api.testnet.mysome.id.

````
REACT_APP_SERVICE_BASE="https://api.testnet.mysome.id/" yarn dev
```

