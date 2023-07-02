# Getting Started with the MYSOME web-app project

## Available Scripts

In the project directory, you can run:

### `yarn build`

Builds the web-app front-end application for the smart contracts / eco-system.

### `yarn dev`

Builds the web-app front-end application for development with hot-reloading hosted on http://localhost:3000


## Dependencies

The web-app project use the shard library chrome-ext-shared which has to be build before the web-app is build.

See the README.md document in the chrome-ext-shared library for various relevant configurations.

## Debugging

When debugging build the chrome-ext-shared library for development to enable verbose level console logging.

## Run against the public TestNet API

Per default the web-app runs against a local mysome API running at http://0.0.0.0:8080.

In order to test against testnet when developing start the web-app using the testnet confugired API deployed on https://api.testnet.mysome.id 

````
REACT_APP_SERVICE_BASE="https://api.testnet.mysome.id/" yarn dev
```

