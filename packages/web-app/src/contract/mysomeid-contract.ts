import {
  HttpProvider,
  AccountAddress,
  InstanceInfo,
  JsonRpcClient,
  serializeUpdateContractParameters,
  deserializeReceiveReturnValue,
  toBuffer,
  AccountTransactionType,
  UpdateContractPayload,
  CcdAmount, 
  deserializeTransaction
} from "@concordium/web-sdk";

import {
  detectConcordiumProvider,
  WalletApi
} from '@concordium/browser-wallet-api-helpers';

import {
  default as RAW_SCHEMA_BASE64
} from '!base64-inline-loader!./mysomeid.schema.bin';

const RAW_SCHEMA = RAW_SCHEMA_BASE64.substr(RAW_SCHEMA_BASE64.indexOf(',') + 1);

type Params = {
  CONTRACT_NAME: string;
  CONTRACT_INDEX: bigint;
  CONTRACT_SUB_INDEX?: bigint;
};

export type ContractFacade = {
  waitForTX: (id: string) => Promise<void>;
  view: () => Promise<any | null>;
  tokenMetadataUrl: (id: string) => Promise<string | null>;
  mint: (account: string, params: MintParams) => Promise<string>;
  burn: (account: string, params: BurnParams) => Promise<string>;
  ownTokens: (account: string) => Promise<any[]>;
};

type MintParams = {
  'owner': {
    "Account": string[];
  },
  'token': string;
  'platform': 'li';
  'challenge': string;
  'credential': string;
  "first_name": string;
  "last_name": string;
  "user_data": string;
  proofs: [number, string][];
};

type BurnParams = {
  'token': string;
};

export default ({CONTRACT_NAME, CONTRACT_INDEX, CONTRACT_SUB_INDEX: CONTRACT_SUB_INDEX = 0n}: Params ): ContractFacade => { 
  const view = async (): Promise<null | any> => {
    const provider = await detectConcordiumProvider();
    const client = provider.getJsonRpcClient();

    const result = await client.invokeContract({
      method: `${CONTRACT_NAME}.view`,
      contract: { index: CONTRACT_INDEX, subindex: CONTRACT_SUB_INDEX },
    });
    // console.log(result);    

    if( result?.tag === 'success' ) {
      const returnValue = deserializeReceiveReturnValue(
          toBuffer(result.returnValue, 'hex'),
          toBuffer(RAW_SCHEMA, 'base64'),
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

  const mint = async (account: string, params: MintParams): Promise<string> => {
    const provider = await detectConcordiumProvider();

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0n),
      message: undefined,
      address: {
        index: CONTRACT_INDEX,
        subindex: CONTRACT_SUB_INDEX,
      },
      receiveName: `${CONTRACT_NAME}.mint`,
      maxContractExecutionEnergy: 30000n,
    };

    const tx = await provider.sendTransaction(
      account,
      AccountTransactionType.Update,
      updatePayload,
      params,
      RAW_SCHEMA
    );

    return tx;
  };

  const burn = async (account: string, params: BurnParams): Promise<string> => {
    const provider = await detectConcordiumProvider();

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0n),
      message: undefined,
      address: {
        index: CONTRACT_INDEX,
        subindex: CONTRACT_SUB_INDEX,
      },
      receiveName: `${CONTRACT_NAME}.burn`,
      maxContractExecutionEnergy: 30000n,
    };

    const tx = await provider.sendTransaction(
      account,
      AccountTransactionType.Update,
      updatePayload,
      params,
      RAW_SCHEMA
    );

    return tx;
  };

  const ownTokens = async (account: string): Promise<any[]> => {
    const client = (await detectConcordiumProvider()).getJsonRpcClient();

    const parameter = serializeUpdateContractParameters(
      CONTRACT_NAME,
      'ownTokens',
      {
        owner: account
      },
      toBuffer(RAW_SCHEMA, 'base64'),
    );
 
    const result = await client.invokeContract({
      method: `${CONTRACT_NAME}.ownTokens`,
      contract: { index: CONTRACT_INDEX, subindex: CONTRACT_SUB_INDEX },
      parameter,
    });

    if( result?.tag === 'success' ) {
      const returnValue = deserializeReceiveReturnValue(
          toBuffer(result.returnValue, 'hex'),
          toBuffer(RAW_SCHEMA, 'base64'),
          CONTRACT_NAME,
          'ownTokens',
          2
      );
      // debugger;
      return returnValue.tokens;

    } else {
      console.error("Failed to read from contract ", result);
    }

    return [];
  };

  const tokenMetadataUrl = async (id: string) => {
    debugger;
    const client = (await detectConcordiumProvider()).getJsonRpcClient();
    const parameter = serializeUpdateContractParameters(
      CONTRACT_NAME,
      'tokenMetadata',
      [id],
      toBuffer(RAW_SCHEMA, 'base64'),
    );
    const params = {
      contract: {
        index: CONTRACT_INDEX,
        subindex: CONTRACT_SUB_INDEX
      },
      method: `${CONTRACT_NAME}.tokenMetadata`,
      parameter
    };
    return new Promise<null |  string> ( (resolve, reject) => {
      client
        .invokeContract(params)
        .then(result => {
          // console.log("result ", result);
          if (result && result.tag === 'success' && result.returnValue) {
            const bufferStream = toBuffer(result.returnValue, 'hex');
            const length = bufferStream.readUInt16LE(2);
            const url = bufferStream.slice(4, 4 + length).toString('utf8');
            // resolve("asdad");
            resolve(url);
          } else {
            console.log("failed to get metadata for token", id);
            resolve(null);
          }
        });  
    });
  };
  
  const waitForTX = async (tx: string) => {
    const provider = await detectConcordiumProvider();
    console.log("Waiting for CCD TX ", tx);
    let status: string | string = null;
    let timeOut = 0;
    while( !status || (['failure', 'success', 'finalized'].indexOf((status ?? '')) === -1) ) {
      if ( timeOut > 0 ) 
        await (new Promise<void>(resolve => window.setTimeout(resolve, 1000)));
      const result = await provider.getJsonRpcClient().getTransactionStatus(tx);
      status = result?.status;
      console.log("TX Status ", status );
      if ( timeOut++ > 120 ) { // 30 optimistic?
        throw new Error("Timed out!");
      } 
    }
    if ( status === 'failure' ) {
      throw new Error('Transaction failed.');
    }
  };

  return {
    waitForTX,
    view,
    tokenMetadataUrl,
    mint,
    ownTokens,
    burn,
  };
};

