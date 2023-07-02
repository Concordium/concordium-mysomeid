# Getting started

The project is a shared component which contains reused code in the front-end projects of the extension and the web-app.

## Developing

In the project directory, you can run:

### `yarn build`

Builds the shared libery for production use.

### `yarn build:dev`

Builds the shared library with source mapping, development level code minification etc.

## Configuration

The shared library can be build with diffirent configuraion.

### Logger

The logger component can be build with diffirent log levels enabled this is done by setting the environment variable LOG_LEVEL at compilation time.

Anything but errors are disabled unless for development purposes.

off/default (error)
warn (error + warn)
info (error + info)
debug (error + warn + info + verbose)


```
Example:

LOG_LEVEL="debug" yarn build
```

