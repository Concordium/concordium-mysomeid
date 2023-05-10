import { EnvironmentTypes } from "./environment-types";

export const sharedConfig = {
    defaultEnvironment: 'main-net',
    defaultVerbose: false,
    environments: {
        dev: {
            serviceBaseUrl: 'http://0.0.0.0:8080/v1',
            webAppBaseUrl: 'http://localhost:3000',
            homeUrl: 'http://localhost:3000/home',
        },
        'test-net': {
            serviceBaseUrl: 'https://api.testnet.mysome.id/v1',
            webAppBaseUrl: 'https://app.testnet.mysome.id',
            homeUrl: 'https://app.testnet.mysome.id/home',
        },
        'main-net': {
            serviceBaseUrl: 'https://api.mysome.id/v1',
            webAppBaseUrl: 'https://app.mysome.id',
            homeUrl: 'https://app.mysome.id/home',
        },
    },
};

export const webAppHomeUrlFromEnvironment = (environment: EnvironmentTypes) => {
    const result = sharedConfig.environments?.[environment]?.homeUrl;
    if ( !result  ){
        throw new Error('Invalid environment : ' + environment );
    }
    return result;
};

export const webAppBaseUrlFromEnvironment = (environment: EnvironmentTypes) => {
    const result = sharedConfig.environments?.[environment]?.webAppBaseUrl;
    if ( !result  ){
        throw new Error('Invalid environment : ' + environment );
    }
    return result;
}

export const serviceBaseUrlFromEnvironment = (environment: EnvironmentTypes) => {
    const result = sharedConfig.environments?.[environment]?.serviceBaseUrl;
    if ( !result  ){
        throw new Error('Invalid environment : ' + environment );
    }
    return result;
}
