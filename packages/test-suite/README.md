# MYSOMEID - Test suite

The background of this test suite is to provide a set of high level tests that can be used to ensure that the entire 


## E2E

The package contains a single test which tests the complete registration flow. 

The prerequisites for running the test is that the linkedin profile used for testing has been authenticated with the google session. See User data on how to do that.

NOTE: Running the e2e test in a git job may not be feasible so for the time beeing consider the e2e test as a development tool to ensure that the 


## Integration

The integration test suite tests diffirent aspects of the high level flows with a mocked version of a LinkedIn profile to ensure that the following flows works;

- Registration
- Showing valid profile status with extension (Own profile)
- Showing invalid profile status with extension (Own profile)
- Showing valid profile status with extension (Other profile)
- Showing invalid profile status with extension (Other profile)
- Validating that backend is ablet to detect QR codes in various background images.


## How to run?

Integration test suite

```
yarn test:docker:integration:build && yarn test:docker:integration:run
```

E2E test suite

```
yarn test:docker:integration:build && yarn test:docker:integration:run
```

NOTE: Running the integration tests in a git job shouuld be possible since it uses a mocked version of linked-in. However the concordium wallet may need to be topped up with additional CCD on testnet in order to fully run it until something akin to Hardhat on Ethereum is developed for concordium which should allow for an improved integration test suite.


## How to develop the tests?

The tests needs sudo to be able to change the etc/hosts file to mock linkedin.com as well as to create a server that listens on 443 to simualte a https service.

To avoid having to run with sudo the development is dockerised so run 

docker compose run testdev to modify the tests.


## User data

The user-data.tar.gz is an archieve with the state of the data needed to start chrome with it can be created by following this guide. (Only if needed to update the data)

- Run a local X11 server by following this guide;
    - MacOS: http://mamykin.com/posts/running-x-apps-on-mac-with-docker/
    - Windows: https://stackoverflow.com/questions/42181805/x11-forwarding-of-gui-app-in-docker-container
    - Linux: https://unix.stackexchange.com/questions/403424/x11-forwarding-from-a-docker-container-in-remote-server

- Run 'docker compose run testdev' to start the dockerised version made ready to test

- Then the command 'yarn browser'. (chromium which can be used to export a new user-data.tar.gz file with extensinos enabled for testing )

- Ensure that the Concordium wallet extension and Mysome extension is added to the browser. 

- Ensure The Concordium wallet must be initialised on testnet with some capital on it. (test-wallet.txt contains a keyphrase to a wallet with some test ccd on it.)

- Close the Browser and run 'yarn pack-user-data && cp user-data.tar.gz ./volume' to copy the archived user dato the shared volume and move the copied file from the volume folder to the root of the test suite.

- Rebuild the docker image by running 'docker compose build' to use the new user-data you just created.






