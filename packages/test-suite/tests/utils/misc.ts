import puppeteer, { Page, Browser, Frame } from 'puppeteer'; // import Puppeteer
import * as path from 'path';
const hostile = require('hostile');

// Path to the actual extension we want to be testing
const extFolder = path.join(__dirname, '..', '..', 'chrome-ext', 'build');
const extId = 'djpgalkjihkfbccfmlfdpginepddgeho';
const extUrl = `chrome-extension://${extId}/popup/index.html`;

const extensionUrl = 'chrome-extension://daimccmahfjkehhogdlpppfcokcmkpbe/widget/index.html';

const ccdWalletExt = path.join('extensions', 'dist');

declare var $: (s: string) => any;
declare var $$: (s: string) => any[];

export const setLinkedInHost = () => {
  hostile.set('127.0.0.1', 'www.linkedin.com');
  hostile.set('127.0.0.1', 'linkedin.com');  
  return () => {
    hostile.remove('127.0.0.1', 'linkedin.com');
    hostile.remove('127.0.0.1', 'www.linkedin.com');  
  };
};

export async function clickButtonWithLabel(page: Page, label: string): Promise<string | null> {
  const evalError = await page.evaluate((label) => {
    console.log("Clicking button with label ->" + label);
    try {
      const $$ = (s: string) => Array.prototype.slice.call(document.querySelectorAll(s));
      const $ = document.querySelector as any;

      const btn = $$('button').find(x => x.innerText.trim().toLowerCase().indexOf(label.toLowerCase()) >= 0);
      if (!btn) {
        throw new Error('No create proof button found');
      }
      btn.click();

      return null;
    } catch (e) {
      console.error(e);
      return e?.message ?? 'Unknown error';
    }
  }, label);
  const result = evalError ?? null;
  expect(result).toBe(null);

  return result;
}

export async function assertElement(page: Page, selector: string): Promise<void> {
  const evalElementExists = await page.evaluate((selector) => {
    try {
      const $ = (s: string) => document.querySelector as any;
      if ( !!$(selector) ) {
        return selector;
      }
    } catch (e) {
      console.error(e);
      return e?.message ?? 'Unknown error';
    }
    return null;
  }, selector);
  expect(evalElementExists ?? null).toBe(selector);
}

export async function openSelect(page: Page, selector: string): Promise<string | null> {
  await assertElement(page, selector);
  const evalError = await page.evaluate((selector) => {
    try {
      const $ = (s: string) => document.querySelector as any;
      const evt = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      const element = document.querySelector(selector) as any;
      if (!element) {
        throw new Error('Element not found' + selector );
      }
      element.dispatchEvent(evt);
    } catch (e) {
      console.error(e);
      return e?.message ?? 'Unknown error';
    }
  }, selector);
  const result = evalError ?? null;
  expect(result).toBe(null);
  return result;  
}

export async function sleep(d: number) {
  return new Promise<void>(resolve => setTimeout(resolve, d));
}

export async function evaluateExpectNoException({ page, fn, debug, args }: { page: Page | Frame, fn: any, debug?: boolean, args?: (string | number | boolean)[]}): Promise<any> {
  if ( args && args.length > 7 ) {
    throw new Error('Only up to 7 args are supported');
  }
  const code = `((a1, a2, a3, a4, a5, a6, a7) => {
    ${!!debug ? `debugger;` : ''}
    let retVal;
    let exception = null;

    try {
      const $$ = (s) => {
        const ret = Array.prototype.slice.call(document.querySelectorAll(s));
        // console.log("Found objects " + s, ret);
        return ret;
      };
      const $ = (s) => {
        const ret = document.querySelector(s);
        // console.log("Found object " + s, ret);
        return ret;
      };
      retVal = (${fn.toString()})(a1, a2, a3, a4, a5, a6, a7);
    } catch(e) {
      exception = e.message ?? 'Unknown error';
    }

    return {
      retVal,
      exception,
    };
  })()`;
  // console.log("code; ", code);
  const retVal = await page.evaluate(code);

  if ( (retVal as any).exception !== null ) {
    console.error("failed executing code; ", code, " exception ", (retVal as any).exception );
  }
  expect((retVal as any).exception).toBe(null);

  return (retVal as any).retVal;
}

export function createUtils(pageGetter: () => Page ) {
  async function pageEval(fn: any, args?: (string | number | boolean)[]): Promise<any> {
    const retVal = await evaluateExpectNoException({
      page: pageGetter(),
      fn,
      args,
    });
    return retVal;
  }

  async function extFrameEval(fn: any, args?: (string | number | boolean)[], url?: string): Promise<any> {
    // console.log("frames ", pageGetter().frames().map( x => x.url() ) );
    const iframe = pageGetter().frames().find(iframe => iframe.url().includes(url ?? extensionUrl));
    expect(iframe).toBeDefined();
    if (!iframe) {
      throw new Error('No frame found');
    }
    const retVal = await evaluateExpectNoException({
      page: iframe,
      fn,
      args,
    });
    return retVal;
  }

  function hasFrame(url?: string): boolean {
    // console.log("frames ", pageGetter().frames().map( x => x.url() ) );
    const iframe = pageGetter().frames().find(iframe => iframe.url().includes(url ?? extensionUrl));
    return !!iframe;
  }

  async function info (s: string): Promise<void> {
    console.log(s);
    await pageGetter().evaluate((s) => console.log(s), s);
  }

  return {
    pageEval,
    extFrameEval,
    hasFrame,
    info,
  };
}
