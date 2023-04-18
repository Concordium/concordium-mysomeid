import puppeteer, { Page, Browser, KnownDevices } from 'puppeteer';
import * as path from 'path';

import {
  sleep,
  createUtils,
} from '../utils';

import {
  qrDecodedUrl,
} from '../config';

declare var $: (s: string) => any;
declare var $$: (s: string) => any[];    

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--show-component-extension-options`
];

describe('Mobile QR code scanning', () => {
  let page: Page;
  let browser: Browser;

  const {
    pageEval,
    extFrameEval,
    hasFrame,
    info,
  } = createUtils(() => page);

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      // slowMo: 250,
      devtools: true,
      userDataDir: path.join('user-data'),
      args: puppeteerArgs
    });
  });

  afterAll(async () => {
    await browser?.close();
  });

  it(`Will open up mobile site when scanned`, async () => {
    page = await browser.newPage();
    await page.emulate(KnownDevices['iPhone 6 Plus']);
    await page.goto(qrDecodedUrl, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    const hasLabel = await pageEval(() => {
      return !!$$('p').find(x => x.innerText?.indexOf('You have scanned a MYSOME identity proof') >= 0);
    });
    expect(hasLabel).toBe(true);    
  });

});
