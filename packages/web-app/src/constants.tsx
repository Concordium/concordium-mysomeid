
export function serviceUrl(route: string, params?: Record<string, string | number | boolean> | string ): string {
    if ( params ) {
        if ( typeof params === 'object' ) {
            params = Object.entries(params as Record<string, string | number | boolean>)
                        .reduce((acc, elem) => {
                            return acc + (acc ? '&' : '') + elem.join('=')
                        }, '');
        }
    }
    const baseUrl = 'https://api.testnet.mysome.id/v1';
    return  baseUrl + route + (params ? '?' + params : '');
}

export const extensionUrl = process.env.REACT_APP_EXTENTION_URL ?? "https://chrome.google.com/webstore/detail/mozbar/eakacpaijcpapndcfffdgphdiccmpknp";

export const ccdExtensionUrl = process.env.REACT_APP_CCD_EXTENTION_URL ?? "https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg";

export const proofBaseUri = process.env.REACT_APP_BASE_URL ?? "https://app.mysomeid.dev";

export const proofViewUrlBase = [proofBaseUri, 'v'].join('/');

export const appleAppstoreUrl = process.env.REACT_APP_STORE_URL ?? 'itms-apps://itunes.apple.com/app/apple-store/id375380948?mt=8';

export const googlePlayUrl = process.env.REACT_APP_PLAY_URL ?? `https://play.google.com/store/apps/details?id=org.kidinov.unixadmin`;

export const URLHANDLER_BASE_URL = process.env.REACT_URL_HANDLER_BASE  ?? 'exp://192.168.1.5:19000/--/';

export const linkedInProfileBaseUrl = 'https://www.linkedin.com/in/';

export function getUrlHandlerUrl(device: 'iOS' | 'Android', args: string) {
    if ( device === 'iOS' ) {
        return URLHANDLER_BASE_URL + args;
    }
    return URLHANDLER_BASE_URL + args;
}

export function getAppStoreUrlForDevice(device: 'iOS' | 'Android') {
    if ( device === 'iOS' ) {
        return appleAppstoreUrl;
    }
    return googlePlayUrl;
}
