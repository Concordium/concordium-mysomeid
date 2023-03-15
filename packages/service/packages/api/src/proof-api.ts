import fs from 'fs';
import path from 'path';
import { Express, Request, Response } from 'express';
import {
  getStatement
} from './statement';
import qr from 'qr-image';
import {
  AttributesKeys,
  // AttributeList,
  HttpProvider,
  // IdentityObjectV1,
  // IdObjectRequestV1,
  // IdProofInput,
  JsonRpcClient
} from '@concordium/node-sdk';
import { parseMySoMeProofUrl } from './utils/parse-proof-url';
import taskManager from './task-manager';
// import createTaskFetchLinkedInProfileData from './task-fetch-linkedin-profile-data';
import createTaskResolveProfileData, {ResolveProfileDataTask} from './task-resolve-profile-data';
import createTaskResolveProfileDataVer2, {ResolveProfileDataTaskVer2, testName} from './task-resolve-profile-data-ver2';
import { getScraper } from './scraper';
import crypto from 'crypto';
import {getContract} from './mysomeid-contract';
import {getChallenge} from './challenge';

const API_BASE = process.env.API_BASE ?? 'https://api.mysomeid.dev/v1/';

const isValidUrl = (urlString: string) => {
  const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

const UrlPlatformId = {
  LinkedIn: 'li'
};

const client = new JsonRpcClient(new HttpProvider(process.env.CCD_JSON_RPC_URL ?? "https://json-rpc.testnet.concordium.com"));

import {
  verify
} from './verify';

function getDirectoryContents(dirPath: string) {
  const dirContents = fs.readdirSync(dirPath, { withFileTypes: true });
  const result: any = {};

  dirContents.forEach((dirEntry) => {
    if (dirEntry.isFile()) {
      result[dirEntry.name] = ''; // add file to result object
    } else if (dirEntry.isDirectory()) {
      // recursively traverse subdirectory and add its contents to result object
      const subDirPath = path.join(dirPath, dirEntry.name);
      result[dirEntry.name] = getDirectoryContents(subDirPath);
    }
  });

  return result;
}

export default (app: Express) => {
  // Returns the statement of the proof API.
  app.get('/proof/statement', (req, res) => {
    const statement = getStatement();
    res.json({
      statement
    });
  });

  app.get('/proof/test', (req, res) => {
    const dirContents = getDirectoryContents(process.cwd());
    res.json(dirContents);
  });

  // curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/validation?p=li&u=crispy-beans-12321312&proof=cc58464234ae19438f06b66c017e14b7f0305b94313d4dc0252413abeb2323ea"
  app.post('/proof/verify', async (req: Request<{}, {}, {
    account: string,
    proof: string,
    challenge: string,
  }, {}>, res: Response) => {
    try {
      const {proof, challenge, account} = req.body;

      console.log({proof, challenge, account});

      console.log("proof", JSON.stringify(proof));

      if ( !proof || !challenge || !account ) {
        res.status(500).json({code: 500, error: 'Internal server error'});
        return;
      }

      const statement = getStatement();

      console.log("Calling verification executeable", {
        statement,
        address: account,
        proof,
        challenge
      });
 
      const result = await verify({
        statement: JSON.stringify(statement),
        address: account,
        proof: JSON.stringify(proof),
        challenge
      });

      return res.json({
        result,
      });
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  });

  app.get('/wallet/:account/txs', async (req: Request<{account: string}, {}, {}, {limit: number, from: string, order: string}>, res: Response) => {
    const {
      account 
    } = req.params;

    if ( !account ) {
      throw new Error('No account');
    }

    const {
      limit,
      from,
      order,
    } = req.query;

    if (!limit ){
      throw new Error('No limit');
    }

    const proxyPath =
      `v1/accTransactions/${account}?limit=${limit}&order=${order}&includeRawRejectReason${from ? `&from=${from}` : ''}`;
      const base = process.env.WALLET_PROXY_BASE ?? "https://wallet-proxy.testnet.concordium.com";

    const response = await fetch(`${base}/${proxyPath}`, {
      method: 'GET',
    });
      
    const result = await response.json();

    res.status(200).json({
      transactions: result?.transactions ?? [],
    });
  });

  // This is used by the extension to validate a proof url scanned from the QR code.
  const validateProofRequest = async (req: Request<{}, {}, {}, {url: string, firstName: string, lastName: string, platform: 'li', userData: string}>, res: Response) => {
    try {
      const {
        url,
        firstName,
        lastName,
        platform,
        userData,
      } = req.query;

      console.log("GET: Validate proof", {url, firstName, lastName, platform, userData});

      if ( !url ) {
        throw new Error('No proof url');
      }

      if (!firstName) {
        throw new Error('No first name');
      }

      if (!lastName) {
        throw new Error('No last name');
      }

      if (!platform) {
        throw new Error('No platform');
      }

      if ( !userData ) {
        throw new Error('No user data');
      }

      const components = decodeURIComponent(url).split("/").filter(x => x.trim());
      const id = components[components.length-1];

      if ( !id ) {
        throw new Error('No id in proof url');
      }

      const proofData = await getContract().tokenProofData(id);

      console.log('Proof to validate: ', JSON.stringify(proofData, null, ' '));

      if ( !proofData ) {
        console.log("Failed getting proof data for proof with id : " + id);
        res.status(200).json({
          status: 'invalid',
          id,
        });
        return;
      }

      if ( proofData.revoked ) {
        console.log("Proof is revoked : " + id);
        res.status(200).json({
          status: 'invalid',
          id,
        });
        return;

      }

      // proofData.

      // construct a proof object based on the data we have available.
      // const challenge = proofData.challenge;
      const credential = proofData.credential;
      const firstNameProof = proofData.proofs.find( ([attr]) => attr === AttributesKeys.firstName )?.[1] ?? '';
      const lastNameProof = proofData.proofs.find( ([attr]) => attr === AttributesKeys.lastName )?.[1] ?? '';

      if (!firstNameProof ) {
        throw new Error('No first name proof');
      }
 
      if (!lastNameProof) {
        throw new Error('No Last name proof');
      }

      if (!platform || !userData) {
        return res.status(500).json({error: 'Invalid arguments'});
      }
  
      if (platform !== 'li') {
        throw new Error('Only linked in supported : ' + platform);
      }
  
      const challenge = getChallenge(platform, userData);

      const statement = JSON.stringify(getStatement());
      const address = proofData.owner?.Account?.[0] ?? '';

      const proof = JSON.stringify({
        "credential": credential,
        "proof": {
          "v": 0,
          "value": {
            "proofs": [
              {
                "attribute": testName( firstName, proofData.first_name ),
                "proof": firstNameProof,
                "type": "RevealAttribute"
              },
              {
                "attribute": testName( lastName, proofData.last_name ),
                "proof": lastNameProof,
                "type": "RevealAttribute"
              }
            ]
          }
        }
      });
      
      const result = await verify({
        statement,
        address,
        proof,
        challenge
      });
      
      res.status(200).json({
        status: result ? 'valid' : 'invalid',
        id,
      });
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  };
  app.get('/proof/validate-proof-url', validateProofRequest);
  app.get('/proof/validate', validateProofRequest);

  // Returns the NFT image material when wallet requests it.
  // curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/img?t=thumb"
  // curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/img"
  // https://api.mysomeid.dev/v1/proof/BOtX2GFi/img?t=thumb?p=li
  app.get('/proof/:proof/img', async (req: Request<{proof: string}, {}, {}, {t: 'thumb' | 'display', p: 'li', r: '1' | '0' | undefined}>, res: Response) => {
    try {

      const {
        proof 
      } = req.params;

      const {
        t: type,
        p: platform,
        r,
      } = req.query;

      const revoked = r === '1' || r !== '0';

      // console.log("revoked ", r, req.query);
      // Read the image file from disk
      const data = fs.readFileSync(path.join(process.cwd(), 'images', `nft${revoked ? '-revoked': ''}.png`));
      if (!data) {
        res.status(500).send('Error reading image');
        return;
      }
      
      // Set the response content type to PNG and send the image data
      res.setHeader('Content-Type', 'image/png');
      res.send(data);
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  });


  // How the oracle verifies the provided proofUrl 
  // 1. Decode proofQRData ( split into componennts )
  // 2. Check that the proofQR data contains
  //  2.1 A proof id and that the proof id matches the id of the provided proof id.
  //  2.2 A platform index.
  //  2.3 Some user data.
  //  2.4 A challenge.
  // 3. check that the provided ProofId matches the id in the url.
  // 4. Assemble the profile url based ont he platform rules.
  // 5. Fetch the onchain proof data;
  //  5.1 decrypt and decode the proof data bytes.
  // 6. Assemble a challenge based on the platform id and the username (according the platform rules)
        // For linked in it would be something like; https://www.linkedin.com/in/joe-moe-33Cc153/
  // 7. Verify that the proof is okay 
  // 8. Return all data for the client to show it to the user.
  app.get('/proof/oracle/validate', async (req: Request<{}, {}, {url: string}>, res: Response) => {
    try {
      // proofId: string, platform: string, userData: string

      const {
        url
      } = req.query;

      const proofUri = decodeURIComponent(url?.toString() ?? '');      

      const {
        id: proofId,
        error: parseError,
      } = parseMySoMeProofUrl(proofUri);

      if ( parseError || !proofId ) {
        res.status(500).json({code: 500, error: 'Invalid proof uri', proofId, parseError});
        return;

      }

      const scraper = getScraper();
      const task = await createTaskResolveProfileDataVer2({scraper, proofUri});
      taskManager.runBg(task);

      res.status(200).json({
        id: task.id,
      });
      return;

    } catch(e) {
      console.error("Error", e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });

    }

  });

  app.get('/proof/oracle/validate/:id/status', async (req: Request<{id: string}, {}, {}>, res: Response) => {
    try {
      const {
        id
      } = req.params;

      const task: ResolveProfileDataTaskVer2 = taskManager.get(id);

      if ( !task ) {
        throw new Error('No context available');
      }

      res.json({
        id: task.id,
        status: task.status,
        error: null,
        payload: task.result
      });
    } catch(e) {
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  });
  
  // Return the challenge for a given account.
  app.get('/proof/challenge', async (req: Request<{}, {}, {}, {
    platform: string,
    userData: string,
  }>, res: Response) => {
    const {
      platform,
      userData,
    } = req.query;

    if ( !platform || !userData ) {
      return res.status(500).json({error: 'Invalid arguments'});
    }

    if ( platform !== 'li' ) {
      throw new Error('Only linked in supported : ' + platform);
    }

    const challenge = getChallenge(platform, userData);
  
    res.json({challenge});
  });
  
  app.post('/proof/:id/nft', async (req: Request<{
    id: string
  },
  {},
  {
    firstName: string,
    surName: string,
    platform: string,
    userData: string,
    account: string,
    challenge: string,
    imageUrl?: string,
    proof: any,
  }, {
  }>, res: Response) => {
    try {
      const {
        id,
      } = req.params;

      const {
        firstName,
        surName,
        platform,
        userData,
        account,
        challenge,
        proof,
        imageUrl,
      } = req.body;

      // Fallback on the default linkedin if no imageurl is given.
      let profilePictureUrl = imageUrl ?? 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh';

      if ( !proof || !challenge || !account || !firstName || !surName ) {
        res.status(500).json({code: 500, error: 'Internal server error'});
        return;
      }

      if ( platform !== 'li' ) {
        throw new Error('Unsupported platform : ' + platform);
      }
      
      if (proof?.proof?.value?.proofs?.length !== 2) {
        throw new Error('invalid proof object.');
      }

      // const firstNameProof = proof.proof.value.proofs[0].proof;
      // const lastNameProof = proof.proof.value.proofs[1].proof;
      console.log("proof ", JSON.stringify( proof, null , ' ') );

      const statement = getStatement();

      const result = await verify({
        statement: JSON.stringify(statement),
        address: account,
        proof: JSON.stringify(proof),
        challenge
      });

      if ( !result ) {
        console.log("Proof is invalid.");
        res.status(500).json({
          error: 'Invalid proof',
        });
        return;
      }

      // TODO: when we eventually want to pay for the NFT we can initiate it here.

      res.status(200).json({status: 'mint-yourself', tx: null});
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  });

  app.get('/proof/:proofId/nft', async (req: Request<{proofId: string}, {}, {}, {}>, res: Response) => {
    try {
      const {
        proofId,
      } = req.params;
      console.log("Getting proof : " + proofId);
  
      const proofData = await getContract().tokenProofData(proofId);

      if ( !proofData ) {
        throw new Error('Proof not found');
      }

      console.log("proofData ", JSON.stringify(proofData, null, '  '));

      /*{
        "challenge": "c94c93340ce2116211ba47fa429a15896856122a86eab0e8c25644f50414780f",
        "credential": "97c2491a18d8316a0f73dfd82c5c012d942c91c8f3f8190804297b35458cba170920a35f98add6b27c420dd9d2f63745",
        "first_name": "John",
        "last_name": "Doe",
        "owner": {
          "Account": [
            "4FSkV8ckXL9o3KxbY2kdD76a4Je3JWvV4EBmXkFNwjYddjc5zY"
          ]
        },
        "proofs": [
          [
            0,
            "9f68aa2c22d63e512afa515b18dd6238afde133cd3f7a803ff2b3f34848db6af34e38ecf72deca1641d1e37197c12f1a1b16f524050c38b5537d5c9dddbda5b1"
          ],
          [
            1,
            "9239f62983b42b2fabbcd34b072cd30d86e6eeb153284ea3741dd9b3b2dd1703357cc0b5fa564e10283d9218c625c62944b442e84f27f2895ef1a1a7dc1889b4"
          ]
        ],
        "token_id": "1C4dRfAh",
        "user_data": "kristian-mortensen-66bb291"
      }*/

      res.status(200).json({
        id: proofId,
        firstName: proofData?.first_name ?? null,
        lastName: proofData?.last_name ?? null,
        platform: proofData?.platform ?? null,
        userData: proofData?.user_data ?? null,
        profileImageUrl: `https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh`, // TODO: Use scraper to resolve it.
        profileUrl: proofData?.user_data ? `https://www.linkedin.com/in/${proofData?.user_data}` : null,
      });
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }    
  });

  // Returns the QR code from the proofId.
  app.get('/proof/:proofId/:platform/:userData/qr', async (req: Request<{proofId: string, platform: string, userData: string}, {}, {}, {}>, res: Response) => {
    try {
      const {
        proofId,
        platform,
        userData,
      } = req.params;

      if (!proofId) {
        res.status(500).json({error: 'No proof id provided'});
        return;
      }

      if (!platform) {
        res.status(500).json({error: 'No platform provided'});
        return;
      }

      if (!userData) {
        res.status(500).json({error: 'No user data provided'});
        return;
      }

      if (platform !== UrlPlatformId.LinkedIn) {
        res.status(500).json({error: 'Invalid platform provided'});
        return;
      }

      const baseUrl = process.env.PROOF_NFT_IMAGE_BASE_URL ?? `https://app.mysomeid.dev`;
      const viewComponent = process.env.PROOF_NFT_IMAGE_VIEW_URL_COMPONENT ?? 'v';
      const proofValidationUrl = [
        baseUrl,
        viewComponent,
        proofId,
        platform,
        userData
      ].join('/');

      if (!isValidUrl(proofValidationUrl) ) {
        console.error("Url is invalid : " + proofValidationUrl);
        res.status(500).json({error: 'Failed constructing URL from provided arguments'});
        return;
      }
      
      console.log("Creating QR code for url " + proofValidationUrl);
      const result = qr.image(
        proofValidationUrl,
        {
          // error correction level. One of L, M, Q, H. Default M.
          ec_level: 'H',
          // image type. Possible values png(default), svg, pdf and eps.
          type: 'png',
          // (png and svg only) for png and undefined for svg.-(png and svg only) — size of one module in pixels.
          size: 16,
          // (only png)for png and 1 for others.-white space around QR image in modules.
          margin: 1,
          // (experimental, default false) try to optimize QR-code for URLs.
          parse_url: true,
        }
      );
      
      result.pipe(res);

    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });

    }
  });
  
  // Returns the metadata for the proof NFT.
  // curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/meta"
  app.get("/proof/meta/:proof", (req: Request<{proof: string}, {}, {}, {p: string, r: string}>, res: Response) => {
    try {
      const {
        p: platform,
        r: revoked,
      } = req.query;
      const {
        proof: proofId
      } = req.params;
      console.log("returning meta data for wallet : " + {platform, revoked});
      return res.json({
        name: "MYSOME.ID",
        decimals: 0,
        description: "Soulbound NFT used to prove that a profile on a social media account is valid.",
        unique: true,
        thumbnail: {
          url: `${API_BASE}proof/${proofId}/img?t=thumb?p=${platform}&r=${revoked}`
        },
        display: {
          url: `${API_BASE}proof/${proofId}/img?t=display?p=${platform}&r=${revoked}`
        },
      });
    } catch(e) {
      console.error(e);
      return res.status(500).json({
        code: 500,
        error: 'internal server error',
      });
    }
  });

};
