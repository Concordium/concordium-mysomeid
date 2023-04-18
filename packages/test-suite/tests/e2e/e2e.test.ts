import puppeteer, { Page, Browser } from 'puppeteer'; // import Puppeteer
import * as path from 'path';

// Path to the actual extension we want to be testing
const extFolder = path.join(__dirname, '..', '..', '..', 'chrome-ext', 'build');
const extId = 'djpgalkjihkfbccfmlfdpginepddgeho';
const extUrl = `chrome-extension://${extId}/popup/index.html`;

const extensionUrl = 'chrome-extension://daimccmahfjkehhogdlpppfcokcmkpbe/widget/index.html';

const ccdWalletExt = path.join('extensions', 'dist');

import {
  sleep,
  clickButtonWithLabel,
  // assertElement,
  openSelect,
  createUtils,
} from '../utils';

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--show-component-extension-options`,
  `--disable-extensions-except=${extFolder},${ccdWalletExt}`,
];

declare var $: (s: string) => any;
declare var $$: (s: string) => any[];

const linkedInAccount = 'kristian-mortensen-66bb291';

describe('E2E tests', () => {
  let page: Page;
  let browser: Browser;

  const {
    pageEval,
    extFrameEval,
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
    // Tear down the browser
    await browser.close();
  });

  describe("Create proof", () => {
    it('can open the dapp and start creating the proof', async () => {
      page = await browser.newPage();
      await page.goto('https://app.mysomeid.dev', { waitUntil: 'domcontentloaded' });
      await sleep(1000);
      expect(await page.url()).toBe('https://app.mysomeid.dev/home');
      await clickButtonWithLabel(page, 'create proof');
      await sleep(1000);
      expect(await page.url()).toBe('https://app.mysomeid.dev/create/1');  
    }, 60 * 1000);

    describe("can complete step 1 - fill out name", () => {
      it('can open the platform select and select linkedin', async () => {
        await openSelect(page, 'div.MuiSelect-select[role="button"]');
        await sleep(1000);
        await pageEval(() => {
          const sel = $('[data-value="li"]');
          console.log('clicking select! ', sel);
          sel.click();
          console.log('select clicked  ');
        });
        await sleep(250);
        const value = await pageEval(() => {
          return $('.MuiSelect-nativeInput')?.value ?? null; 
        });
        expect(value).toBe('li');        
      });
      
      it('can set the name in the input field', async () => {
        await page.focus('input[type="text"]');
        await page.keyboard.type(linkedInAccount, {delay:  50});
        const retVal = await pageEval(() => {
          const selector = 'input[type="text"]';
          const elem = $(selector) as any as HTMLInputElement;
          return elem.value;
        });
        expect(retVal).toBe(linkedInAccount);
      });

      it( 'can click next', async () => {
        // Click the next;
        await clickButtonWithLabel(page, 'Next');
        await sleep(250);

        // wait until we are done.
        let cnt = 0;
        let wait = true;
        while( wait && cnt++ < (60 / 5) * 5 ) {
          const ret = await pageEval(() => {
            const elem = $$('p').filter( x => x?.innerText === 'Validating LinkedIn profile.')[0];
            if (elem) { 
              const style = getComputedStyle(elem);
              return style?.display === 'block' && style?.visibility === 'visible';
            } 
            return false;
          });
          if ( !ret ) {
            wait = false;
            await sleep(250);
          } else {
            await sleep(5000);
          }
        }

        if ( cnt++ >= (60 / 5)*5 ) {
          throw new Error('Timed out waiting for page');
        }

        expect(await page.url()).toBe('https://app.mysomeid.dev/create/2');       
      }, 60000 * 5);
    });

    describe("can complete step 2 - connect id", () => {
      it('is located on the correct page', async () => {
        expect(await pageEval(() => $('h3')?.innerText)).toBe('Your Profile to Secure');
        // expect(await pageEval(() => $('h3').innerText)).toBe('Connect Concordium Wallet');
      });

      it('can get wallet identity', async () => {
        await info('can get wallet identity');
        let buttonText = null;
        while ( buttonText === null || buttonText === 'Connect Concordium Wallet' ) {
          await info('Connecting to CCD wallet and waiting 8 secs');
          await pageEval(() => $('button[type="button"]')?.click());
          await sleep(8000);
          buttonText = await pageEval(() => $('button[type="button"]')?.innerText);
          await info('Checking if button text is "Connect Concordium Wallet". Button text is' + buttonText);
        }
        
        buttonText = null;
        while ( buttonText === null || buttonText === 'Connect With Your Concordium ID' ) {
          await info('Connecting with CCD Idenity and waiting 8 secs');
          await pageEval(() => $('button[type="button"]').click());
          await sleep(8000);
          buttonText = await pageEval(() => $('button[type="button"]').innerText);
          await info('Checking if button text is "Connect With Your Concordium ID". Button text is' + buttonText);
        }
      }, 60000 );

      it('has changed to step 3', async () => {
        const nextButtonText = await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.innerText );
        expect(nextButtonText).toBe('Create Proof');
        expect(await page.url()).toBe('https://app.mysomeid.dev/create/3');
      });
    });

    describe('complete step 3 - create proof', () => {
      it('has a correct next button label and url', async () => {
        expect(await page.url()).toBe('https://app.mysomeid.dev/create/3');
        const nextButtonText = await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.innerText );
        expect(nextButtonText).toBe('Create Proof');
      });

      it('can create the proof', async () => {
        await info('can create the proof');
        await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.click?.() );

        let loadingText = await pageEval(() => $('h5')?.innerText);
        let ts = new Date().getTime();
        while ( !loadingText ) {
          if ( new Date().getTime() - ts > 5000 ) {
            throw new Error('Timed out waiting for loading text to be Creating proof')
          }
          loadingText = await pageEval(() => $('h5')?.innerText);
          await sleep(250);
        }

        ts = new Date().getTime();
        while(loadingText === 'Creating Proof' ) {
          if ( new Date().getTime() - ts > 75000 ) {
            throw new Error('Timed out waiting for wallet to be done')
          }
          loadingText = await pageEval(() => $('h5')?.innerText ?? '');
          await sleep(1000);
        }

        const headerText = await pageEval(() => $('h3')?.innerText );
        expect(headerText).toBe('Your Proof is Ready');
        expect(await page.url()).toBe('https://app.mysomeid.dev/create/4');
      }, 60000 * 2);
    });

    describe('complete step 4 - finalize proof', () => {
      it( 'redirects to profile page on linkedin.com after some time', async () => {
        await info('redirects to profile page on linkedin.com after some time');
        let nextButtonText = await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.innerText );
        expect(nextButtonText).toBe('Next');
        await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.click?.() );
        await sleep(250);

        let headerText = await pageEval(() => $('h3')?.innerText );
        expect(headerText).toBe('Connect With LinkedIn');

        await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.click?.() );
        await sleep(250);

        expect(await pageEval(() => !!$('#editor-content') )).toBe(true);
        nextButtonText = await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.innerText );
        expect(nextButtonText).toBe('Open LinkedIn');
        await pageEval(() => $$('form > div.MuiBox-root > button')[1]?.click?.() );
        await sleep(250);

        await sleep(10000);

        // Must conain linkedin in the url.
        expect((await page.url().toLowerCase())).toContain('linkedin.com');
        expect((await page.url().toLowerCase())).toContain(linkedInAccount);
      }, 30000);
    });

    describe('Step 5 - Change LinkedIn background', () => {
      // it ( 'can lopen linkedin - test test', async () => {
      //   page = await browser.newPage();
      //   await page.goto('https://www.linkedin.com/in/kristian-mortensen-66bb291/', { waitUntil: 'domcontentloaded' });
      //   await sleep(1000);
      // });

      it('is located on the profile page', async () => {        
        await info('Step 5');
        expect((await page.url().toLowerCase())).toContain('linkedin.com');
        expect((await page.url().toLowerCase())).toContain(linkedInAccount);
        let cnt = 0;
        while( cnt++ < 5 ) {
          const iframe = page.frames().find(iframe => iframe.url().includes(extensionUrl));
          await sleep(250);
          if ( iframe ) {
            break;
          }
          if ( cnt >= 5 ) {
            throw new Error('timed out waiting for iFrame to open on linkedin.');
          }
          await sleep(750);
        }
      });

      it('can click the update background button', async () => {
        await info('testing if we can click update background button in extension');

        await extFrameEval(() =>
          console.log( $$('*') )
        );

        let hasUpdateBackgroundButton = await extFrameEval(() =>
          !!$$('button.MuiButtonBase-root').find(x => x.innerText.toUpperCase() === 'UPDATE BACKGROUND')
        );
        expect(hasUpdateBackgroundButton).toBe(true);

        let cnt = 0;
        while ( hasUpdateBackgroundButton ) {
          await info('clicking update background button');
          await extFrameEval(() => {
            $$('button.MuiButtonBase-root').find(x => x.innerText.toUpperCase() === 'UPDATE BACKGROUND')?.click()
          });
          await sleep(250);
          hasUpdateBackgroundButton = await pageEval(() => {
            const btn = $$('button.MuiButtonBase-root').find(x => x.innerText.toUpperCase() === 'UPDATE BACKGROUND');
            if (!btn) {
              return false;
            }
            const btnStyle = getComputedStyle(btn);
            return btnStyle.visibility === 'visible';
          });
          await sleep(250);
          if ( !hasUpdateBackgroundButton ){
            break;
          }
          if ( ++cnt > 3 ) {
            throw new Error('Not able to click button.');
          }
          await sleep(4500);
        }
        await sleep(2000);
        
        // expect(hasUpdateBackgroundButton).toBe(false); // the update button should no longer be rendered after clicking it.
        await info('Waiting until done loading');
        cnt = 0;
        while( cnt++ < 30 ) {
          const loading = await extFrameEval(() =>
            !!$$('h5').find(x => x.innerText === 'Loading')
          );
          await sleep(1000);
          if ( !loading ) {
            break;
          }
        }

        const doneShown = await extFrameEval(() =>
          !!$$('p.MuiTypography-root').find(x => x.innerText === 'Registration Done')
        );
        expect(doneShown).toBe(true);
      }, 60000);

      it('can click the done button', async () => {
        let doneButtonAvail = await extFrameEval(() =>
          !!$$('button.MuiButtonBase-root').find(x => x.innerText.toUpperCase() === 'OK')
        );
        expect(doneButtonAvail).toBe(true);
        await extFrameEval(() =>
          $$('button.MuiButtonBase-root').find(x => x.innerText.toUpperCase() === 'OK')?.click()
        );
        await sleep(250);

        let cnt = 0;
        let iframe;
        while( cnt++ < 5 ) {
          await sleep(250);
          if ( iframe ) {
            break;
          }
          iframe = page.frames().find(iframe => iframe.url().includes(extensionUrl));
          if (!iframe) {
            break;
          }
          if ( cnt >= 5 ) {
            throw new Error('timed out waiting for iFrame to be hidden');
          }
          await sleep(750);
        }
      });

      it('has the shield components injected', async () => {
        const hasShieldCheck = await pageEval(() => !!$('#mysome-shield-check'));
        const hasShieldDots = await pageEval(() => !!$('#mysome-shield-dots'));
        expect(hasShieldCheck).toBe(true);
        expect(hasShieldDots).toBe(true);
      });

      it('has a valid verified sign after its done setting the background', async () => {
        let shieldDotsDisplay = null;
        let cnt = 0;
        while ( [null, 'none'].indexOf(shieldDotsDisplay) === -1 ) {
          await sleep(1000);
          shieldDotsDisplay = await pageEval(() =>
            getComputedStyle( $('#mysome-shield-dots') ).display
          );
          if ( cnt++ > 20 ) {
            throw new Error('Timed out waiting for extension to show verification.');
          }
        }
        await sleep(10000);
        const shieldCheckDisplay = await pageEval(() =>
          getComputedStyle( $('#mysome-shield-check') ).display
        );
        expect(shieldCheckDisplay).toBe('block');
      });
    });

    describe('When the background is deleted the shield changes state to no longer verified profile.', () => {
      it('Can click delete background to reset validated state', async () => {
        await pageEval(() => $('button[aria-label="Edit profile background"]').click());
        await sleep(1500);
        const deleteButtonExists = await pageEval(() =>
          !!$$('button').find(x => x.innerText === 'Delete photo' )
        );
        expect(deleteButtonExists).toBe(true);
        await pageEval(() =>
          $$('button').find(x => x.innerText === 'Delete photo' ).click()
        );
        await sleep(1000);
        const deleteConfirmExists = await pageEval(() =>
          !!$$('button').find(x => x.innerText === 'Delete' )
        );
        expect(deleteConfirmExists).toBe(true);
        await pageEval(() =>
          $$('button').find(x => x.innerText === 'Delete' ).click()
        );
        await sleep(3000);
        let shieldDotsDisplay = null;
        let cnt = 0;
        while ( [null, 'none'].indexOf(shieldDotsDisplay) === -1 ) { // while dots are visible.
          await sleep(1000);
          shieldDotsDisplay = await pageEval(() =>
            getComputedStyle( $('#mysome-shield-dots') ).display
          );
          if ( cnt++ > 20 ) {
            throw new Error('Timed out waiting for shield to be loading');
          }
        }
        await sleep(1000);
        const shieldExclaimDisplay = await pageEval(() =>
          getComputedStyle( $('#mysome-shield-exclaim') ).display
        );
        expect(shieldExclaimDisplay).toBe('block');
      });

    });

  });

});
