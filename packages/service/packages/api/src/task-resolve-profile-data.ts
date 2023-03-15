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

import CryptoJS from 'crypto-js';

import {
  verify
} from './verify';

import taskManager, {
  Task
} from './task-manager';

import {
  capitalize
} from './utils/capitalize';

import createTaskFetchLinkedInProfileData, { FetchLinkedInProfileTask } from './task-fetch-linkedin-profile-data';

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

export class ResolveProfileDataTask implements Task {
  constructor(
    public fnc: (context: ResolveProfileDataTask) => Promise<void>,
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
    public getProfileTask: FetchLinkedInProfileTask | null,
    public progress: number = 0,
    public error: string | null = null,
  ) {
  }
}

const main = async (context: ResolveProfileDataTask): Promise<any> => {
  console.log("Process request in background");

  context.progress++;

  const {
    id: proofId,
    error: parseError,
    platform,
    userData,
  } = parseMySoMeProofUrl(context.proofUri);

  if ( parseError || !proofId ) {
    throw new Error('No proof :' + (parseError ?? ''));
  }

  if( !userData ) {
    throw new Error('No user data');
  }

  // validate platform
  if ( platform !== 'li' ) {
    // res.status(500).json({error: 'unknown platform'});
    throw new Error('Unknown platform: ' + platform);
  }
  
  const platformUri = `https://www.linkedin.com/in/${userData}/`;

  console.log('Fetching linked-in profile data');
  const task = await createTaskFetchLinkedInProfileData({
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
  const firstName = capitalize(nameComponents[0] ?? '');
  const surName = capitalize(nameComponents[nameComponents.length - 1] ?? '');

  // Get the contract info;
  const contract = getContract();
  console.log('TODO: IMPL getting proof data');
  console.log('Getting token metadata');
  const metaData = await contract.tokenMetadataUrl(proofId);
  if ( !metaData ) {
    console.error("Failed to get metadata");
    context.status = 'error';
    context.error = 'No metadata';
    return;
  }
  const {
    revoked,
    uri: metadataUri,
    // owner: address,
  } = metaData ?? {};
  context.progress++;

  // Create challenge from profile url.
  const hash = CryptoJS.SHA256(platformUri);
  const buffer = Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex');
  const challenge = Buffer.from(new Uint8Array(buffer)).toString('hex');
  const date = Math.round(new Date().getTime() / 1000); // time in seconds.
  console.log('challenge : ', challenge);

  // Return the statement.
  const statement = getStatement();
  console.log('statement ', statement);

  console.log("TODO: Get the address of the owner of the proof nft on-chain.");
  const address = '4FSkV8ckXL9o3KxbY2kdD76a4Je3JWvV4EBmXkFNwjYddjc5zY';

  // Harcoded challenge
  const challengeTest = 'ae94a1bedd3ad7a4bbb338ffb6f15d3aec7865a2506a2efe2a6bf93956e1a93f';

  const insertTest = {
    firstName: 'John', // TODO: Insert first name from linkedin.
    // firstName: firstName,
    surName: 'Doe',  // TODO: Insert sur name from linkedin.
    // surName: surName,
    countryOfResidence: 'DK', // TODO: Insert country from linkedin.
    // countryOfResidence: country,
  };

  const proofComponents = {
    credential: '97c2491a18d8316a0f73dfd82c5c012d942c91c8f3f8190804297b35458cba170920a35f98add6b27c420dd9d2f63745',
    firstNameProof: '8b7392977eee55bcba1887579ea372a7254b9150b6fdc1959122d5ee174d1e8a557bcf5dec403c340fe1741fff49944f038e9aa17197a2a53d52dcb483235541',
    surNameProof: '872bce6bec774e86dcc72abbfae211195cc7786e9a851f9f851d1eb5bf197d522bc0c3f364ac6eaf424a296f20ed65f6212d56e7ac274eddfdbe9dcc8f4924c5',
    countryOfResidenceProof: 'c38b4f40cf43d4aa9280cee5abe6ff52f0c4e2b72abd655bec54d4349ce352613e3230043cbd65a05d136f0b41aadc159a57beca49b0adb8cb4ed614d439d5d1',
  };

  // TODO: Insert the credental, first, second and last proof for the attributes.
  // and insert the name.
  const proof = {
    "credential":  proofComponents.credential,
    "proof": {
      "v": 0,
      "value": {
        "proofs": [
          {
            "attribute": insertTest.firstName,
            "proof": proofComponents.firstNameProof,
            "type": "RevealAttribute"
          },
          {
            "attribute": insertTest.surName,
            "proof": proofComponents.surNameProof,
            "type": "RevealAttribute"
          },
          {
            "attribute": insertTest.countryOfResidence,
            "proof": proofComponents.countryOfResidenceProof,
            "type": "RevealAttribute"
          }
        ]
      }
    }
  }; 

  console.log('Verifing proof/challange');
  const result = await verify({
    statement: JSON.stringify(statement),
    address, // address
    proof: JSON.stringify(proof),
    challenge: challengeTest
  });

  context.progress++;

  if ( !result ) {
    context.status = 'error';
    context.error = 'Invalid proof';
    return;
  }

  context.progress++;

  console.log("TODO: solve that its saved at a particular date");

  console.log("TODO: Get profie picture uri from scraper and/or store profile picture temp and serve it through the service.");
  const profilePicUri = 'https://media.licdn.com/dms/image/D5603AQGKYh-_QAoMqA/profile-displayphoto-shrink_400_400/0/1673006091287?e=1681948800&v=beta&t=kWnlF-WW2OgT-ngz-XZgewADA858BRWanwjoZypzYA8';

  const proofMetadata: ResolvedMetadata = { // call the validate function with the proof to make sure that its valid.
    platform,
    userData,
    firstName: 'John',
    surName: 'Doe',
    country: 'DK',
    profilePicUri,
    platformUri,
    revoked: false,
    valid: true,
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
}): Promise<ResolveProfileDataTask> => {  

  const task: ResolveProfileDataTask = new ResolveProfileDataTask(
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