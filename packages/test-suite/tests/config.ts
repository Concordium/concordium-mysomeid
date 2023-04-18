import * as path from 'path';

export const extFolder = process.env.EXT_FOLDER ?? path.join(__dirname, '..', '..', 'chrome-ext', 'build');
export const extId = process.env.EXT_ID ?? 'djpgalkjihkfbccfmlfdpginepddgeho';
export const extUrl = process.env.EXT_URL ?? `chrome-extension://${extId}/popup/index.html`;
export const extensionUrl = process.env.EXT_WIDGET_BASE_URL ?? 'chrome-extension://daimccmahfjkehhogdlpppfcokcmkpbe/widget/index.html';
export const ccdWalletExt = process.env.CCD_WALLET_EXT ?? path.join('extensions', 'dist');
export const qrDecodedUrl = process.env.QR_DECODE_URL ?? 'https://app.mysomeid.dev/v/PuKBjRT1';

export const appBaseUrl = process.env.APP_BASE_URL ?? 'https://app.mysomeid.dev';
export const appHomeUrl = process.env.APP_HOME_URL ?? 'https://app.mysomeid.dev/home';
export const appCreateStep1Url = process.env.APP_CREATE_STEP_1_URL ?? 'https://app.mysomeid.dev/create/1';
export const appCreateStep2Url = process.env.APP_CREATE_STEP_2_URL ?? 'https://app.mysomeid.dev/create/2';
export const appCreateStep3Url = process.env.APP_CREATE_STEP_3_URL ?? 'https://app.mysomeid.dev/create/3';
export const appCreateStep4Url = process.env.APP_CREATE_STEP_4_URL ?? 'https://app.mysomeid.dev/create/4';
export const apiBaseUrl = process.env.API_BASE_URL ?? 'https://api.mysomeid.dev';

export const linkedInAccount = process.env.LINKED_IN_ACCOUNT ?? 'kristian-mortensen-66bb291';

