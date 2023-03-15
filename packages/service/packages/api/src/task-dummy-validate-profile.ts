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

import {
  ProfileInfo 
} from './task-fetch-linkedin-profile-data';

export class TaskDummyValidateProfile implements Task {
  constructor(
    public fnc: (context: TaskDummyValidateProfile) => Promise<any>,
    public id: string,
    public error: string | null,
    public status: string | null,
    public profileInfo: ProfileInfo | null,
    public profileExists: boolean | null = null,
    public url: string = '',
    public currentLocation: string = '',
    public screenshot: string,
    public scraperContext: any,
  ) {
  }
}

const main = async (context: TaskDummyValidateProfile): Promise<any> => {
  console.log("Process request in background");

  context.status = 'opening';
  await Timeout.set(5000);

  context.profileInfo = {
    onlyUrl: true,
    name: '',
    profileImage: 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh',
    backgroundImage: '',
    country: '',
  };
  context.profileExists = true;
  

  context.status = 'done';
}

const createTask = async ({
  url
}: {
  url: string,
}): Promise<TaskDummyValidateProfile> => {
  
  const task = new TaskDummyValidateProfile(
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
  );
  
  return task;
};

export default createTask;