# Getting Started with the MYSOME extension project


## Available Scripts

In the project directory, you can run:

### `yarn build`

Builds all components of the extension and stores it in build.

## Dependencies

The extension component projects use the shard library chrome-ext-shared which has to be built before the chrome-ext is built.

The chrome-ext-shared library is shared as a local yarn mono repository package.

See the README.md file for how the shared library can be configured to enable logging in the chrome-ext project.

## Debugging

When debugging build the chrome-ext-shared library for development to enable verbose level console logging.
