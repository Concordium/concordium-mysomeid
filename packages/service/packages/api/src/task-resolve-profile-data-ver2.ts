import {
  Scraper,
  ScraperContext,
} from './scraper';

import {
  getStatement
} from './statement';

import { parseMySoMeProofUrl } from './utils/parse-proof-url';

import {
  getContract
} from './mysomeid-contract';

import {
  verify
} from './verify';

import taskManager, {
  Task
} from './task-manager';

import {
  capitalize
} from './utils/capitalize';

import createTaskFetchLinkedInProfileDataVer2, { FetchLinkedInProfileTaskV2 } from './task-fetch-linkedin-profile-data-ver2';
import { getChallenge } from './challenge';
import { AttributesKeys } from '@concordium/common-sdk';

export type ResolvedMetadata = {
  platform: string;
  userData: string;
  firstName: string;
  surName: string;
  country: string;
  profilePicUri: string;
  platformUri: string;
  revoked: boolean;
  valid: boolean;
  date: number;
};

export class ResolveProfileDataTaskVer2 implements Task {
  constructor(
    public fnc: (context: ResolveProfileDataTaskVer2) => Promise<void>,
    public scraper: Scraper,
    public id: string,
    public status: string | null,
    public profileExists: boolean | null,
    public profileInfo: any | null,
    public proofUri: string,
    public currentLocation: string,
    public screenshot: any | null,
    public scraperContext: ScraperContext | null,
    public result: ResolvedMetadata | null,
    public getProfileTask: FetchLinkedInProfileTaskV2 | null,
    public progress: number = 0,
    public error: string | null = null,
  ) {
  }
}

export function testName(publicNameValue: string, proofNameValue: string) {
  if ( publicNameValue.trim().toLowerCase() !== proofNameValue.trim().toLowerCase() ) {
    return publicNameValue;
  }
  return proofNameValue;
}

const main = async (context: ResolveProfileDataTaskVer2): Promise<any> => {
  console.log("Process request in background");

  context.progress++;

  const {
    id: proofId,
    error: parseError,
  } = parseMySoMeProofUrl(context.proofUri);

  if ( parseError || !proofId ) {
    throw new Error('No proof :' + (parseError ?? ''));
  }

  if( !proofId ) {
    throw new Error('No proof id');
  }

  // Get the contract info;
  const contract = getContract();

  const proofData = await getContract().tokenProofData(proofId);
  if ( !proofData ) {
    console.error("Failed to get metadata");
    context.status = 'error';
    context.error = 'No metadata';
    return;
  }
  context.progress++;

  const date = Math.round(new Date().getTime() / 1000); // time in seconds.
  const credential = proofData.credential;
  const firstNameProof = proofData.proofs.find( ([attr]) => attr === AttributesKeys.firstName )?.[1] ?? '';
  const lastNameProof = proofData.proofs.find( ([attr]) => attr === AttributesKeys.lastName )?.[1] ?? '';
  const platform = proofData.platform;
  const firstName = proofData.first_name;
  const lastName = proofData.last_name;
  const address = proofData.owner?.Account?.[0] ?? '';
  const userData = proofData.user_data;
  const revoked = proofData.revoked;
  const platformUri = `https://www.linkedin.com/in/${userData}/`;

  // validate platform
  if ( platform !== 'li' ) {
    console.log("Proof is revoked");
    context.result = {
      platform,
      userData,
      firstName: proofData.first_name,
      surName: proofData.last_name,
      revoked: true,
      platformUri,
      country: '',
      profilePicUri: 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh',
      valid: false,
      date: date,
    };
    context.status = 'done';
    return;
  }

  if ( !firstNameProof || !lastNameProof ) {
    context.status = 'error';
    context.error = 'Invalid first/last name proof';
    return;
  }
  
  if ( platform !== 'li' ) {
    context.status = 'error';
    context.error = 'Invalid platform';
    return;
  }

  if ( !userData) {
    context.status = 'error';
    context.error = 'Invalid user data';
    return;
  }

  console.log('Fetching linked-in profile data');
  const task = await createTaskFetchLinkedInProfileDataVer2({
    scraper: context.scraper,
    url: platformUri,
  });
  try {
    await task.fnc(task);
    if ( task.status !== 'done' || !task.profileInfo ) {
      console.error('Failed to get profile info for url : ' + platformUri);
      context.status = 'error';
      context.error = 'Failed to get profile info (1)';
      return;
    }
  } catch(e) {
    console.error(e);
    context.status = 'error';
    context.error = 'Failed to get profile info (2)';
    return;
  }
  console.log('Done fetching profile data');

  // Extract profile data
  const {
    name,
    profileImage,
    // backgroundImage,
    country,
  } = task.profileInfo;

  const nameComponents = (name ?? '').trim().split(' ').filter((x: string) => !!x);
  const scraperFirstName = capitalize(nameComponents[0] ?? '');
  const scraperSurName = capitalize(nameComponents[nameComponents.length - 1] ?? '');

  if (!scraperFirstName || !scraperSurName ) {
    context.status = 'error';
    context.error = 'Failed retrieving name from profile.';
    return;
  }

  const challenge = getChallenge(platform, userData);
  const statement = getStatement();

  context.progress++;

  // TODO: Insert the credental, first, second and last proof for the attributes.
  // and insert the name.
  const proofToTest = {
    "credential":  credential,
    "proof": {
      "v": 0,
      "value": {
        "proofs": [
          {
            "attribute": testName(scraperFirstName, proofData.first_name ),
            "proof": firstNameProof,
            "type": "RevealAttribute"
          },
          {
            "attribute": testName(scraperSurName, proofData.last_name ),
            "proof": lastNameProof,
            "type": "RevealAttribute"
          }
        ]
      }
    }
  }; 

  console.log('Verifing proof/challange');
  const valid = !revoked ? await verify({
    statement: JSON.stringify(statement),
    address, // address
    proof: JSON.stringify(proofToTest),
    challenge: challenge
  }) : false;

  context.progress++;

  const proofMetadata: ResolvedMetadata = { // call the validate function with the proof to make sure that its valid.
    platform,
    userData,
    firstName: firstName,
    surName: lastName,
    country: '',
    profilePicUri: profileImage ?? 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh',
    platformUri,
    revoked,
    valid,
    date,
  };

  context.status = 'done';
  context.result = proofMetadata;
}

const createTask = async ({
  scraper,
  proofUri,
}: {
  scraper: Scraper,
  proofUri: string,
}): Promise<ResolveProfileDataTaskVer2> => {  

  const task: ResolveProfileDataTaskVer2 = new ResolveProfileDataTaskVer2(
    main,
    scraper, 
    /* id: */ taskManager.getId(),
    /* status: */ 'in-progress',
    /* profileExists: */ null,
    /* profileInfo: */ null,
    /* */ proofUri,
    /* currentLocation: */ 'about:blank',
    /* screenshot: */ null,
    /* scraperContext: */ null,
    /* result */ null, 
    null,
    0,
  );
  
  return task;
};

export default createTask;