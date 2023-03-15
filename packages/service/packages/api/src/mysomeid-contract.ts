import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

import {
  HttpProvider,
  JsonRpcClient,
  serializeUpdateContractParameters,
  deserializeReceiveReturnValue,
} from "@concordium/node-sdk";

import { Buffer } from 'buffer/index';

const CCD_JSON_RPC_URL = process.env.CCD_JSON_RPC_URL ?? "https://json-rpc.testnet.concordium.com/";
// const CCD_JSON_RPC_URL = 'https://json-rpc.concordium.com/'

type Metadata = {
  uri: string;
  revoked: boolean;
};

type Params = {
  CONTRACT_NAME: string;
  CONTRACT_INDEX: bigint;
  CONTRACT_SUB_INDEX?: bigint;
};

type ProofDataResponse = {
  challenge: string;
  credential: string;
  proofs: [number, string][];
  first_name: string;
  last_name: string;
  owner: { Account: string };
  platform: 'li';
  user_data: string;
  revoked: boolean;
};

type Contract = {
  view: any;
  tokenMetadataUrl: (id: string) => Promise<Metadata|null>;
  tokenProofData: (id: string) => Promise<ProofDataResponse|null>;
};

function createContractInterface ({CONTRACT_NAME, CONTRACT_INDEX, CONTRACT_SUB_INDEX: CONTRACT_SUB_INDEX = 0n}: Params ): Contract {
  const client = new JsonRpcClient(new HttpProvider(CCD_JSON_RPC_URL, fetch as any));

  const RAW_SCHEMA = fs.readFileSync(path.join(process.cwd(), 'mysomeid.schema.bin'), {encoding: 'base64'}) as string;

  const view = async (): Promise<null | any> => {
    const result = await client.invokeContract({
      method: `${CONTRACT_NAME}.view`,
      contract: { index: CONTRACT_INDEX, subindex: CONTRACT_SUB_INDEX },
    });
    // console.log(result);

    if( result?.tag === 'success' && result.returnValue ) {
      const returnValue = deserializeReceiveReturnValue(
          Buffer.from(result.returnValue, 'hex'),
          Buffer.from(RAW_SCHEMA, 'base64'),
          CONTRACT_NAME,
          'view',
          2
      );
      return returnValue;

    } else {
      console.error("Failed to read from contract ", result);

    }

    return null;
  }

  const tokenMetadataUrl = async (id: string): Promise<Metadata|null> => {
    const parameter = serializeUpdateContractParameters(
        CONTRACT_NAME,
        'tokenMetadata',
        [id],
        Buffer.from(RAW_SCHEMA, 'base64'),
    );
    const params = {
      contract: {
        index: CONTRACT_INDEX,
        subindex: CONTRACT_SUB_INDEX
      },
      method: `${CONTRACT_NAME}.tokenMetadata`,
      parameter
    };
    return new Promise<Metadata|null> ( (resolve, reject) => {
      client
        .invokeContract(params)
        .then(result => {
            console.log("result ", result);
            if (result && result.tag === 'success' && result.returnValue) {
                const bufferStream = Buffer.from(result.returnValue, 'hex');
                const length = bufferStream.readUInt16LE(2);
                const url = bufferStream.slice(4, 4 + length).toString('utf8');
                resolve({uri: url, revoked: url.indexOf('r=1') >= 0});
            } else {
                console.log("failed to get metadata for token", id);
                resolve(null);
            }
        });
    });
  };

  const tokenProofData = async (id: string| null): Promise<ProofDataResponse|null> => {
    const parameter = serializeUpdateContractParameters(
        CONTRACT_NAME,
        'proof',
        id,
        Buffer.from(RAW_SCHEMA, 'base64'),
    );

    const params = {
      contract: {
        index: CONTRACT_INDEX,
        subindex: CONTRACT_SUB_INDEX
      },
      method: `${CONTRACT_NAME}.proof`,
      parameter
    };

    return new Promise<null|ProofDataResponse> ( (resolve, reject) => {
      client
        .invokeContract(params)
        .then(result => {
            console.log("result ", result);
            if (result && result.tag === 'success' && result.returnValue) {

              const returnValue = deserializeReceiveReturnValue(
                Buffer.from(result.returnValue, 'hex'),
                Buffer.from(RAW_SCHEMA, 'base64'),
                CONTRACT_NAME,
                'proof',
                2
              ) as ProofDataResponse;

              resolve(returnValue);
            } else {
              console.error("Failed to get metadata for token", id);
              resolve(null);
            }
        });  
    });
  };

  return {
    view,
    tokenMetadataUrl,
    tokenProofData,
  };
}

let contract: Contract | null = null;

export function getContract() {
  const CONTRACT_NAME = process.env.CONTRACT_NAME ??  "mysomeid";
  const CONTRACT_INDEX = BigInt(Number.parseInt(process.env.CONTRACT_INDEX ?? '3330'));
  const CONTRACT_SUB_INDEX = BigInt(0);
  return (contract ?? (contract = createContractInterface({
    CONTRACT_NAME,
    CONTRACT_INDEX,
    CONTRACT_SUB_INDEX
  })));
}
