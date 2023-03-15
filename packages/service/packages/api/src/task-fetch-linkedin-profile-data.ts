import {
  Scraper,
  // Scraper,
  ScraperContext,
} from './scraper';

import Timeout from 'await-timeout';

import {
  Task
} from './task-manager';
import { sleep } from './utils/parse-proof-url';

export type ProfileInfo = {
  onlyUrl?: boolean | undefined;
  name: string;
  profileImage: string | null;
  backgroundImage: string | null;
  country: string | null;
};

export class FetchLinkedInProfileTask implements Task {
  constructor(
    public fnc: (context: FetchLinkedInProfileTask) => Promise<any>,
    public id: string,
    public status: string | null,
    public profileExists: boolean | null,
    public profileInfo: ProfileInfo | null,
    public url: string,
    public currentLocation: string,
    public screenshot: any | null,
    public scraperContext: ScraperContext,
    public error: string  | null = null,
  ) {
  }
}

const main = async (context: FetchLinkedInProfileTask): Promise<any> => {
  console.log("Process request in background");

  const scraperContext: ScraperContext = context.scraperContext;
  context.profileExists = null;
  context.status = 'opening';
  const verbose = true;

  let scraperStatus: string | null = null;
  let nError = 0;
  while ([null, 'opening'].indexOf(scraperStatus) >= 0) {
    try {
      scraperStatus = await scraperContext.getStatus();
      console.log("Fetching status...");
      console.log("Status = ", scraperStatus);
      nError = 0;
    } catch(e) {
      console.log("Error getting status ", e);
      if ( nError++ >= 2 ) {
        throw new Error('Failed getting status');
      }
    }
    await Timeout.set(1000);
  }

  verbose && console.log("Background processing: page is ok! ", scraperStatus);
  
  verbose && console.log("Evaluating JS to find location");
  const location = await scraperContext.eval('window.location.href');
  verbose && console.log("Scraper: Location evaluated : ", location);

  const closePage = async () => {
    try {
      verbose && console.log("closing page.");
      await scraperContext.release();
      verbose && console.log("Page closed");
    } catch(e) {
      console.error(e);
    }
  };

  if ( !location || (location && typeof location === 'object' && location?.error) || typeof location !== 'string' ) {
    verbose && console.log("Failed to fetch location");
    context.status = "error";
    context.error = 'Failed to get location';
    await closePage();
    return;
  }

  let max = 0;
  if ( location?.indexOf('authwall') >= 0 ) {
    console.error("LinkedIn showed authwall! - fixing by going incognito  and trying again.");
   
    verbose && console.log("Failed to fetch location");
    context.status = "error";
    context.error = 'Failed to get location';
    await closePage();
    return;
  }
  
  // The user doesnt exist.
  if ( location.indexOf('404') >= 0 ) {
    verbose && console.log("result : 404 profile doesnt exists!");
    context.profileExists = false;

  } else if ( location.indexOf('404') === -1 ) {
    const notFoundWhileNotLoggedIn = await scraperContext.eval('!!document.querySelector("h1.page-not-found__headline")');
    if ( notFoundWhileNotLoggedIn ) {
      verbose && console.log("result : profile not found - but also not logged in!!");
      // context.profileExists = false;

    } else {
      verbose && console.log("result : profile maybe exists!");
      context.profileExists = null; 

    }
  }

  context.profileInfo = null;
  if ( context.profileExists !== false  ) {
    verbose && console.log("Result : profile maybe exists - fetch images.");

    let loaderVis = true;
    
    let max = 0;
    while( loaderVis && max++ < 8 ) {
      // -------
      loaderVis = await scraperContext.eval(() => {
        const document = window.document as any;
        const bgLoader = document.querySelector("#app-boot-bg-loader");
        const bootloaderDisplay = bgLoader ? getComputedStyle(bgLoader)?.display : null;
        if ( bootloaderDisplay === 'block' || !bootloaderDisplay ) {
          return true;
        }
        return false;
      });
      // -------
      await new Promise<any>(resolve => setTimeout(resolve, 250));
    }

    let attempts = 0;
    while( !context.profileInfo && attempts++ < 3 ) {
      // -------
      context.profileInfo = await scraperContext.eval(() => {
        const document = window.document as any;
        const profileImgEl = document.querySelector("img.pv-top-card-profile-picture__image,.profile-photo-edit__preview");
        let name = profileImgEl?.alt ?? null;
        let profileImageUrl = profileImgEl?.src;

        if (!name) {
          name = document.querySelector('div.pv-text-details__left-panel')?.querySelector('h1')?.innerText ?? null;
        }
        if (!name) { // not logged in version;
          name = document.querySelector(".top-card-layout__entity-info>h1")?.innerText;
        }

        if ( profileImageUrl === "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" ) {
          const url = profileImgEl ? [0].reduce((acc) => acc?.slice(0, acc.length - 2),
              getComputedStyle(profileImgEl).backgroundImage.replace("url(\"", "")) : null;
          profileImageUrl = url;
        }
        if ( !profileImgEl ) {
          if ( document.querySelector('.profile-photo-edit') ) {
            profileImageUrl = 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh';
          }
        }
        if ( !profileImgEl && !profileImageUrl ) { // not logged in version;
          profileImageUrl = document.querySelector('.top-card__profile-image-container > img')?.src;
        }

        if ( !profileImageUrl ) {
          profileImageUrl = 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh';
        }

        const backgroundImgEl = document.querySelector("img.profile-background-image__image");
        let backgroundImgUrl = backgroundImgEl?.src;
        if ( !backgroundImgEl && !backgroundImgUrl ) { // not logged in version;
          backgroundImgUrl = document.querySelector('.cover-img__image-position>img')?.src;
        }
        if ( !backgroundImgEl && !backgroundImgUrl ) {
          const defaultBackground = document.querySelector(".profile-background-image");
          backgroundImgUrl = defaultBackground ? [0].reduce((acc) => acc?.slice(0, acc.length - 2),
              getComputedStyle(defaultBackground).backgroundImage?.replace("url(\"", "")) ?? null : null;
        }
 
        let country = undefined;
        try {
          country = document.querySelector('section.pv-top-card')?.querySelector(".pv-text-details__left-panel > .text-body-small")?.innerText?.trim() ?? null;
          if (!country) {
            country = (document.querySelector(".top-card-layout__first-subline")?.innerText ?? '').split('\n')?.[0].trim() ?? null;
          }

        } catch(e) {
          console.error("error", e);

        }

        /* console.log("qqq", {
          profileImageUrl,
          backgroundImgUrl,          
        }); */

        return profileImageUrl && backgroundImgUrl ? {
          name,
          profileImage: profileImageUrl ?? null,
          backgroundImage:  backgroundImgUrl ?? null,
          country: country ?? null,
        } : null;
      });

      verbose && console.log("profileInfo ", context.profileInfo );

      if ( !context.profileInfo ) {
        context.profileExists = null; // LinkedIN HTML has maybe changed - null === fault tolerant value which is true-ish.
      } else {
        context.profileExists = true;
      }
    } // end of eval.
    // -------

    if ( !context.profileInfo ) {
      console.log("Retrying resolving the profile info");
      await new Promise<any>(resolve => setTimeout(resolve, 1000));
    }

  } // end of if c.profileExists !== false

  if ( context.profileInfo && context.profileExists !== false ) {
    context.profileInfo.onlyUrl = false;
  }

  verbose && console.log("ret ", context.profileExists );
  
  await closePage();

  context.status = 'done';
}

const createTask = async ({
  scraper,
  url,
}: {
  scraper: Scraper,
  url: string,
}): Promise<FetchLinkedInProfileTask> => {
  console.log("opening url : " + url);
  const scraperContext = await scraper.showPage({url, incognito: false});
  console.log("opened page at ", scraperContext );
  
  const task: FetchLinkedInProfileTask = new FetchLinkedInProfileTask(
    main,
    /* id: */ scraperContext.id,
    /* status: */ scraperContext.status ?? null,
    /* profileExists: */ null,
    /* profileInfo: */ null,
    /* */ url,
    /* currentLocation: */ 'about:blank',
    /* screenshot: */ null,
    scraperContext,
  );
  
  return task;
};

export default createTask;