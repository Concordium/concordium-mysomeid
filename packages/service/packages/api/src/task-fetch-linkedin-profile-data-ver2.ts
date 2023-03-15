import {
  Scraper,
  ScraperContext,
} from './scraper';

import Timeout from 'await-timeout';

import {
  Task
} from './task-manager';

// import { sleep } from './utils/parse-proof-url';

import {
  ProfileInfo 
} from './task-fetch-linkedin-profile-data';

export class FetchLinkedInProfileTaskV2 implements Task {
  constructor(
    public fnc: (context: FetchLinkedInProfileTaskV2) => Promise<any>,
    public id: string,
    public error: string | null,
    public status: string | null,
    public profileInfo: ProfileInfo | null,
    public profileExists: boolean | null = null,
    public url: string = '',
    public currentLocation: string = '',
    public screenshot: string,
    public scraperContext: ScraperContext | null,
    public scraper: Scraper,
  ) {
  }
}

const main = async (taskContext: FetchLinkedInProfileTaskV2): Promise<any> => {
  console.log("FetchLinkedInProfile: Process request in background");

  const scrapeContext = await taskContext.scraper.scrapeLinkedInUrl(taskContext.url);

  while(['error', 'done', null].indexOf(scrapeContext.status) === -1 ) {
    await Timeout.set(1000);
    try {
      await scrapeContext.updateSelf();    
    } catch(e) {
      console.error(e);
    }
  }

  if ( scrapeContext.status === 'done' ) {
    taskContext.profileInfo = {
      onlyUrl: false,
      name: scrapeContext.result?.name,
      profileImage: scrapeContext?.result?.profilePictureUrl,
      backgroundImage: scrapeContext?.result?.backgroundPictureUrl,
      country: '',
    };  
  }

  // this can be handled as an error if we want to make sure that
  // the user experience prevents the user to create invalid proofs.
  // For now since we dont know how stable the scraper is we will
  // just return as if the user is 
  if (scrapeContext.status === 'error' ) {
    taskContext.profileInfo = {
      onlyUrl: true,
      name: '',
      profileImage:  'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh',
      backgroundImage: '',
      country: '',
    };
  }

  taskContext.profileExists = true;
  taskContext.status = 'done';
}

const createTask = async ({
  scraper,
  url
}: {
  scraper: Scraper,
  url: string,
}): Promise<FetchLinkedInProfileTaskV2> => {
  
  const task = new FetchLinkedInProfileTaskV2(
    main,
    Math.round(Math.random() * 999999999999999).toString(),
    null,
    null,
    null,
    null,
    url,
    url,
    '',
    null,
    scraper,
  );
  
  return task;
};

export default createTask;