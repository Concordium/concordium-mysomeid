import fetch from 'node-fetch';
import axios from 'axios';
import { Context } from 'vm';

const SCRAPER_BASE_URL = process.env.SCRAPER_BASE_URL ?? 'http://localhost:3003';

export class ScraperContext {
  public result: null | any = null;

  constructor(public id: string, public connected: boolean, public status: string | null, public url: string, public error: string | null = null) { 
  }

  async changeToIncognito(url: string) {
    this.checkId();
    const urlEncoded = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/incognito?url=` + encodeURIComponent(url);
    const response = await fetch(urlEncoded, {method: 'POST'});
    const payload = await response.json();
    // this.id = payload.newId;
    return payload ?? null;
  }

  async eval(what: any): Promise<any> {
    this.checkId();
    const c = what.toString();
    console.log("Eval code", c.length > 50 ? c.substr(0, 50) + '...' : c);
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/eval`;
    const body = what.toString();
    console.log("POST TO URL : " + url, " body ", body );

    const resultObj = await axios.post(url, {
      data: body,
    });
    if ( resultObj.status !== 200 ) {
      throw new Error('Failed to process request');
    }

    const r = resultObj.data.data;

    // console.log("Eval result ", resultObj, " r ", r);

    console.log("Eval result ", r);
    

    // If the text is a float.
    try {
      if ( Number.parseFloat(r) && Number.isFinite(Number.parseFloat(r)) ) {
        return Number.parseFloat(r);
      }
    } catch(e) {
      console.error(e);
    }

    // If its a boolean.
    try {
      if ( r && (r as any).toLowerCase ) {
        const tmp = r.toLowerCase();
        if ( tmp === 'true' ) {
          return true;
        } else if ( tmp === 'false' ) {
          return false;
        }  
      }
    } catch(e) {
      console.error(e);
    }

    // Test if its a JSON object.
    try {
      return JSON.parse(r);
    } catch(e) {
      // console.log(e);
    }

    // result is a string.
    return r;
  }

  async cookies(): Promise<any[] | null> {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/cookies`;
    console.log("GET URL ", url );
    const response = await fetch(url);
    const payload = await response.json();
    return payload ?? null;
  }

  async deleteCookie(cookie: any): Promise<string | null> {
    if (!cookie) {
      throw new Error('No cookie given');
    }
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/cookies?cookie=` + encodeURIComponent(JSON.stringify(cookie));
    console.log("DELETE URL ", url );
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if ( response.status !== 200 ) {
      console.error("failed to delete cookie");
      throw new Error('Failed to delete cookie');
    }
    const payload = await response.json();
    return payload ?? null;
  }

  async getStatus(): Promise<string | null> {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/context/${this.id}`;
    const response = await fetch(url);
    const payload = await response.json();

    if ( payload && !payload.error && payload.status ) {
      return payload.status;
    }

    return null;
  }

  async updateSelf(): Promise<string | null> {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/context/${this.id}`;
    const response = await fetch(url);
    const payload = await response.json();
    console.log("Payload ,", payload);
    this.status = payload.status;
    this.error = payload.error;
    this.result = payload.result;
    return this.status ?? null;
  }

  async screenshot(): Promise<Buffer> {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/screenshot`;
    console.log("GET URL ", url );
    const response = await fetch(url);
    const r = await response.buffer();
    return r;
  }

  async release(): Promise<any> {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/release`;
    console.log("GET " + url );
    const response = await fetch(url);
    const r = await response.json();
    return r;
  }
  async waitForNavigation() {
    this.checkId();
    const url = `${SCRAPER_BASE_URL}/scraper/p/${this.id}/wait-nav`;
    console.log("GET " + url);
    const response = await fetch(url);
    const r = await response.json();
    return r;
  }
  private checkId() {
    if ( this.id === undefined || this.id === null ) {
      throw new Error('Invalid id');
    }     
  }
};

export class Scraper {
  async showPage({url, incognito}: {url: string, incognito?: boolean}): Promise<ScraperContext> {
    const c = new ScraperContext('', false, null, url);
    const response = await fetch(`${SCRAPER_BASE_URL}/scraper/new-page?url=${encodeURIComponent(url)}&incognito=${incognito ? '1' : '0'}` );
    const o = await response.json();
    c.id = o.id;
    c.connected = true;
    c.status = o.status;
    return c;
  }
  async scrapeLinkedInUrl(url: string): Promise<ScraperContext> {
    const c = new ScraperContext('', false, null, url);
    c.status = 'opening';
    const response = await fetch(`${SCRAPER_BASE_URL}/linked-in/profile?url=${encodeURIComponent(url)}` );
    // console.log("response ,", response.status);
    c.status = response.status >= 200 && response.status < 300 ? 'opening' : 'error';
    /* if ( c.status === 'error' ) {
      throw new Error('Invalid status');
    } */
    const o = await response.json();
    c.id = o.id;
    c.status = o.status;
    c.error = o.error;
    return c;
  }
}

let scraper: Scraper | null = null;

export const getScraper = (): Scraper => {
  if ( !scraper ) {
    scraper = new Scraper();
  }
  return scraper;
};
