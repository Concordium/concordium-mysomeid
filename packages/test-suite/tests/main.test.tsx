import puppeteer, {Page, Browser} from 'puppeteer'; // import Puppeteer
import * as path from 'path';

// Path to the actual extension we want to be testing
const extFolder = path.join(__dirname, '..', '..', 'chrome-ext', 'build');
const extId = 'djpgalkjihkfbccfmlfdpginepddgeho';
const extUrl = `chrome-extension://${extId}/popup/index.html`;

async function sleep(d: number) {
  return new Promise<void>(resolve => setTimeout(resolve, d));
}

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--disable-extensions-except=${extFolder}`,
  `--load-extension=${extFolder}`,
  `--show-component-extension-options`,
];

declare var $$: (s: string) => HTMLHtmlElement[];

async function clickButtonWithLabel(page: Page, label: string): Promise<string | null> {
  const evalError = page.evaluate(() => {
    try {
      async function sleep(d: number) {
        return new Promise<void>(resolve => setTimeout(resolve, d));
      }

      const btn = $$('button').find(x => x.innerText.trim().toLowerCase().indexOf('create proof') >= 0);
      if (!btn) {
        throw new Error('No create proof button found');
      }
      btn.click(); 

      return null;
    } catch(e) {
      console.error(e);
      return e?.message ?? 'Unknown error';
    }
  });
  const result = evalError ?? null;
  expect(result).toBe(null);

  return result;
}

async function selectElemWithInnerTextAndDo({page, tagName, innerText, noChildren, nParents, action}: {page: Page, tagName: string, innerText: string, noChildren: boolean, nParents: number, action: 'click'}): Promise<void> {
  const evalError = page.evaluate(`() => {
    try {
      async function sleep(d: number) {
        return new Promise<void>(resolve => setTimeout(resolve, d));
      }

      let elList = $$('${tagName}').filter(x => x.innerText.trim().toLowerCase().indexOf('${innerText.toLowerCase()}') >= 0);
      if ( elList.length === 0 ) {
        throw new Error('No element found');
      }

      ${noChildren ? `
      elList = elList.filter ( x => x.childElementCount === 0 );
      ` : ''}
      if ( elList.length === 0 ) {
        throw new Error('No element found (2)');
      }

      let el = elList[0];

      if ( !el ) {
        throw new Error('No element found (3)');
      }

      ${nParents > 0 ? `
        let cnt = ${nParents};
        while(cnt > 0) {
          el = el.parentElement;
          cnt--;
        }
      `: ''}

      if ( !el ) {
        throw new Error('No element found (4)');
      }

      ${action === 'click'? `
        try {
          el.click();
        }catch(e) {
          console.error(e);
          throw new Error('Failed clicking element.);
        }
      ` : ``}

      return null;
    } catch(e) {
      console.error(e);
      return e?.message ?? 'Unknown error';
    }
  }`);
  const result = evalError ?? null;
  expect(result).toBe(null);
}

async function evaluate({page, fn}: {page: Page, fn: any}): Promise<void> {
  const evalError = page.evaluate(`() => {
    try {
      ${fn.toString()}();
    }catch(e) {
      return e.message ?? 'Unknown error';
    }
    return null;
  }`);
  const result = evalError ?? null;
  expect(result).toBe(null);
}

describe('Popup page', () => {
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {

    browser = await puppeteer.launch({
      headless: false,
      slowMo: 250,
      devtools: true,
      args: puppeteerArgs
    });

    // navigates to some specific page
    // await page.goto('https://google.com');
  });

  afterAll(async () => {
    // Tear down the browser
    await browser.close();
  })

  it('tests something, will come back to this shortly', async () => {
    // ** will have the code in it
    // await page.goto(extUrl, { waitUntil: 'domcontentloaded' });

    // await page.reload();
    // Creates a new tab
    page = await browser.newPage();
    await page.goto('api.mysomeid.dev', { waitUntil: 'domcontentloaded' });

    clickButtonWithLabel(page, 'create proof');
    await sleep(1000);
    expect(page.url).toBe('https://app.mysomeid.dev/create/1');
    await sleep(250);
    // await selectElemWithInnerTextAndDo({page, tagName: 'div', innerText: 'Select social network...', noChildren: true, nParents: 0, action: 'click'});
    await evaluate({
      page,
      fn: () => {
        const input = $$("input")[0] as any;
        (input.value = 'li';
        const trigger = (el: any, etype: string, custom?: any) => {
          const evt = custom ?? new Event( etype, { bubbles: true } );
          el.dispatchEvent( evt );
        };
        trigger(input, "click");


      },
    });
    await sleep(250);
    await evaluate({
      page,
      fn: () => {
        ($$("input")[1] as any).value = 'kristian-mortensen-22a59b266';
        if ( ($$("input")[1] as any).value !== 'kristian-mortensen-22a59b266') {
          throw new Error('failed to set value on input.');
        }
      },
    });

   
    

    await sleep(100000);

    expect(true).toBe(true);
  });
});
