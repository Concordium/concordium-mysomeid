import puppeteer, { Page, Browser, Frame } from 'puppeteer'; // import Puppeteer
import * as path from 'path';
// import localtunnel from 'localtunnel';
// import * as express from 'express';
// const fs = require('fs');
// const axios = require('axios');

import {
  createUtils,
  sleep,
  createLinkedInMock,
  createTunnel,
  setLinkedInHost,
} from '../utils';

import {
  extFolder,
  // extId,
  // extUrl,
  // extensionUrl,
  ccdWalletExt,
} from '../config';

const puppeteerArgs = [
  `--show-component-extension-options`,
  `--disable-extensions-except=${extFolder},${ccdWalletExt}`,
  '--disable-web-security',
];

declare var $: (s: string) => any;
declare var $$: (s: string) => any[];

describe('Chrome extension', () => {
  let page: Page;
  let browser: Browser;

  const {
    pageEval,
    extFrameEval,
    hasFrame,
    info,
  } = createUtils(() => page);

  let limock: {close: () => void; setBackgroundPathInOtherProfile: (s: string) => void;};
  let tunnel;
  let removeHosts;
  beforeAll(async () => {
    removeHosts = setLinkedInHost();
    tunnel = await createTunnel(80);
    limock = await createLinkedInMock([tunnel.url, 'image'].join('/'));
    browser = await puppeteer.launch({
      headless: false,
      // slowMo: 250,
      devtools: true,
      userDataDir: path.join('user-data'),
      args: puppeteerArgs
    });
  });

  afterAll(async () => {
    removeHosts();
    limock?.close();
    if(browser) {
      await browser?.close();
    }
    await tunnel.close();
  });

  describe("Own profile", () => {
    describe('Inject the badge and shield on an own profile page', () => {
      it('can open the page', async () => {
        page = await browser.newPage();
  
        const userAgent = "Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7412.EU";
  
        await page.setUserAgent(
          userAgent
        );
  
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const headers = request.headers();
            headers['Bypass-Tunnel-Reminder'] = '1';
            headers['User-Agent'] = userAgent;
            request.continue({
                headers
            });
        });
  
        await page.goto('http://www.linkedin.com/in/kristian-mortensen-66bb291/', { waitUntil: 'domcontentloaded' });
  
        // Wait until the shield is created.
        let cnt = 0;
        while (!await pageEval(() => !!document.querySelector(`#mysome-shield-exclaim`)) && cnt++ < 5) {
          await sleep(1000);
        }
        expect(cnt).toBeLessThan(5); // Timed out waiting for shield to be shown.
  
        // Wait until its not showing the "loading" animation.
        cnt = 0;
        while (await pageEval(() => {
          console.log("Waiting for shield 'dots' to be hidden");
          const el = document.querySelector(`#mysome-shield-dots`);
          const display = el ? getComputedStyle(el)?.display ?? null : null;
          return [null, 'block'].indexOf(display) >= 0;
        }) && cnt++ < 30) {
          await sleep(1000);
        }
        expect(cnt).toBeLessThan(30); // Timed out waiting for shield to be shown.
      }, 15000);
  
      it('will show badge', async () => {
        const accessBadgeVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-access-badge`);
          const retVal = !el ? null : getComputedStyle(el)?.visibility ?? null;
          return retVal;
        });
        expect(accessBadgeVisibility).toBe('visible');
      });
  
      it('will show the exclamation mark shield', async () => {
        const exclaimShieldVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-shield-exclaim`);
          const retVal = !el ? null : getComputedStyle(el)?.visibility ?? null;
          return retVal;
        });
        expect(exclaimShieldVisibility).toBe('visible');
      });
  
      it('will not show the checkmark shield', async () => {
        const checkShieldVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-shield-check`);
          const retVal = !el ? null : getComputedStyle(el)?.display ?? null;
          return retVal;
        });
        expect(checkShieldVisibility).toBe('none');
      }, 3000);
    });
  });

  describe("Other profile", () => {
    describe('Show that fake persons profile page with invalid url is invalid', () => {
      it('Can open the page', async () => {
        page = await browser.newPage();
  
        // Ensure tunnel to test works wihtout having to click security warning.
        const userAgent = "Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7412.EU";
        await page.setUserAgent( 
          userAgent
        );
  
        // Bypass tunnel security warning.
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const headers = request.headers();
            headers['Bypass-Tunnel-Reminder'] = '1';
            headers['User-Agent'] = userAgent;
            request.continue({
                headers
            });
        });
  
        // Goto page that has copied over Michael jacksons profile but is a fake.
        await page.goto('http://www.linkedin.com/in/john-doe-123456/', { waitUntil: 'domcontentloaded' });
  
        // Wait until the shield is created.
        let cnt = 0;
        while (!await pageEval(() => !!document.querySelector(`#mysome-shield-exclaim`)) && cnt++ < 5) {
          await sleep(1000);
        }
        expect(cnt).toBeLessThan(5); // Timed out waiting for shield to be shown.
  
        const shieldExists = await pageEval(() => {
          const el = $('#mysome-shield-widget');
          return !!el;
        });
        expect(shieldExists);
  
        // Wait until its not showing the "loading" animation.
        cnt = 0;
        while (await pageEval(() => {
          console.log("Waiting for shield 'dots' to be hidden");
          const el = document.querySelector(`#mysome-shield-dots`);
          const display = el ? getComputedStyle(el)?.display ?? null : null;
          return [null, 'block'].indexOf(display) >= 0;
        }) && cnt++ < 30) {
          await sleep(1000);
        }
  
        expect(cnt).toBeLessThan(30); // Timed out waiting for shield to be shown.
      }, 30000);
  
      it('will NOT show the checkmark shield', async () => {
        const checkShieldVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-shield-check`);
          const retVal = !el ? null : getComputedStyle(el)?.display ?? null;
          return retVal;
        });
        expect(checkShieldVisibility).toBe('none');
      }, 3000);
  
      it('will show the exclamation mark shield', async () => {
        const checkShieldVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-shield-exclaim`);
          const retVal = !el ? null : getComputedStyle(el)?.display ?? null;
          return retVal;
        });
        expect(checkShieldVisibility).toBe('block');
      }, 3000);
  
      it ('will show message when shield is clicked', async () => {
        await pageEval(() => {
          const el = $('#mysome-shield-widget');
          el?.click();
        });
        await sleep(2000);
        expect(hasFrame()).toBe(true);
        const hasTextWithVerified = await extFrameEval(() => {
          const ret = !!$$("p").find(x => x.innerText.indexOf('This persons profile is not verified or suspecious' ) >= 0 );
          return ret;
        });
        expect(hasTextWithVerified).toBe(true);
      });
      
      it ('will close the popup when the \'Okay\' button is clicked', async () => {
        await extFrameEval(() => {
          $$("button").find(x => x.innerText.toUpperCase().indexOf('OKAY') >= 0).click();
        });
        await sleep(2000);
        const frameExists = await pageEval(() => {
          return !!$$('iframe').find(x => x.id.indexOf('mysome') >= 0 );
        });
        expect(frameExists).toBe(false);
      });
    });
  
    describe('Other profile with proof makes the shield show up valid.', () => {
      it('can open the page', async () => {
        page = await browser.newPage();
  
        const userAgent = "Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7412.EU";
  
        await page.setUserAgent(
          userAgent
        );
  
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const headers = request.headers();
            headers['Bypass-Tunnel-Reminder'] = '1';
            headers['User-Agent'] = userAgent;
            request.continue({
                headers
            });
        });
        await page.goto('http://www.linkedin.com/in/mjmjmj/', { waitUntil: 'domcontentloaded' });
  
        // Wait until the shield is created.
        let cnt = 0;
        while (!await pageEval(() => !!document.querySelector(`#mysome-shield-exclaim`)) && cnt++ < 5) {
          await sleep(1000);
        }
        expect(cnt).toBeLessThan(5); // Timed out waiting for shield to be shown.
  
        const shieldExists = await pageEval(() => {
          const el = $('#mysome-shield-widget');
          return !!el;
        });
        expect(shieldExists);
  
        // Wait until its not showing the "loading" animation.
        cnt = 0;
        while (await pageEval(() => {
          console.log("Waiting for shield 'dots' to be hidden");
          const el = document.querySelector(`#mysome-shield-dots`);
          const display = el ? getComputedStyle(el)?.display ?? null : null;
          return [null, 'block'].indexOf(display) >= 0;
        }) && cnt++ < 30) {
          await sleep(1000);
        }
        expect(cnt).toBeLessThan(30); // Timed out waiting for shield to be shown.
      }, 30000);
  
      it('will show the checkmark shield', async () => {
        const checkShieldVisibility = await pageEval(() => {
          const el = document.querySelector(`#mysome-shield-check`);
          const retVal = !el ? null : getComputedStyle(el)?.display ?? null;
          return retVal;
        });
        expect(checkShieldVisibility).toBe('block');
      }, 3000);
  
      it ('will show message when shield is clicked', async () => {
        await pageEval(() => {
          const el = $('#mysome-shield-widget');
          el?.click();
        });
        await sleep(2000);
        expect(hasFrame()).toBe(true);
        const hasTextWithVerified = await extFrameEval(() => {
          const ret = !!$$("p").find(x => x.innerText.indexOf('This persons profile is verified by MYSOME' ) >= 0 );
          return ret;
        });
        expect(hasTextWithVerified).toBe(true);
      });
      
      it ('will close the popup when the back button is clicked', async () => {
        await extFrameEval(() => {
          $$("button").find(x => x.innerText.toUpperCase().indexOf('BACK') >= 0).click();
        });
        await sleep(2000);
        const frameExists = await pageEval(() => {
          return !!$$('iframe').find(x => x.id.indexOf('mysome') >= 0 );
        });
        expect(frameExists).toBe(false);
      });
    });  
  });

});
