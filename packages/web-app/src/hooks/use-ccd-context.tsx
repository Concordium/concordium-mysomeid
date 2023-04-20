import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useDispatch,
} from "react-redux";
import {
  detectConcordiumProvider,
  WalletApi
} from '@concordium/browser-wallet-api-helpers';
import createContractInterface, {ContractFacade} from 'src/contract/mysomeid-contract';
import { AttributesKeys, IdProofOutput /*, TransactionEvent*/ } from "@concordium/common-sdk";
import {
  serviceUrl
} from "src/constants";
import ShortUniqueId from 'short-unique-id';
import { toBuffer } from "@concordium/web-sdk";
import {
  useInterval
} from 'use-interval';

type ProofData = {
  id?: string;
  userData?: string; // linkedin username or other unique platform specific user info.
  proof?: IdProofOutput;
  platform?: 'li' | string;
  revoked?: 1 | 0;
  created?: number;
  firstName?: string;
  lastName?: string;
  tx?: string;
  meta?: {
    challenge?: string;
    credential?: string;
    proofs?: [number, string][];
  };
};

type CreateProofSBNFTArgs = {
  firstName: string;
  surName: string;
  userData: string;
  proof: IdProofOutput;
  platform: "li";
  statementInfo: any;
  challenge: string;
};

type CreateProofSBNFTResult = {
  newProof: ProofData;
  myProofs: ProofData[];
};

type CreateProofStatementResult = {
  challenge: string;
  proof: IdProofOutput | null;
};

type CreateProofStatementArgs = {
  firstName: string;
  surName: string;
  platform: string;
  userData: string;
  account: string;
};

interface WalletProxyAccTransactionsResult {
  count: number;
  limit: number;
  order: string;
  transactions: WalletProxyTransaction[];
}

export enum TransactionKindString {
  DeployModule = 'deployModule',
  InitContract = 'initContract',
  Update = 'update',
  Transfer = 'transfer',
  AddBaker = 'addBaker',
  RemoveBaker = 'removeBaker',
  UpdateBakerStake = 'updateBakerStake',
  UpdateBakerRestakeEarnings = 'updateBakerRestakeEarnings',
  UpdateBakerKeys = 'updateBakerKeys',
  UpdateCredentialKeys = 'updateCredentialKeys',
  BakingReward = 'bakingReward',
  BlockReward = 'blockReward',
  FinalizationReward = 'finalizationReward',
  EncryptedAmountTransfer = 'encryptedAmountTransfer',
  TransferToEncrypted = 'transferToEncrypted',
  TransferToPublic = 'transferToPublic',
  TransferWithSchedule = 'transferWithSchedule',
  UpdateCredentials = 'updateCredentials',
  RegisterData = 'registerData',
  TransferWithMemo = 'transferWithMemo',
  EncryptedAmountTransferWithMemo = 'encryptedAmountTransferWithMemo',
  TransferWithScheduleAndMemo = 'transferWithScheduleAndMemo',
  ConfigureBaker = 'configureBaker',
  ConfigureDelegation = 'configureDelegation',
  StakingReward = 'paydayAccountReward',
  Malformed = 'Malformed account transaction',
}

interface Details {
  description: string;
  type: TransactionKindString;
  outcome: string;
  transferSource: string;
  transferDestination: string;
  events: string[];
  rejectReason: string;
}

enum OriginType {
  Self = 'self',
  Account = 'account',
  Reward = 'reward',
  None = 'none',
}

interface TransactionOrigin {
  type: OriginType;
  address?: string;
}

export interface WalletProxyTransaction {
  id: number;
  blockHash: string;
  cost: string;
  transactionHash: string;
  details: Details;
  origin: TransactionOrigin;
  blockTime: number;
  total: string;
  subtotal: string;
}

type MintTx = {
  tokenId: string;
  tx: WalletProxyTransaction;
};

export type CCDContextData = {
  installed: boolean | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  account: string | undefined;
  provider: WalletApi | null;
  chain: string | null;
  contract: ContractFacade;
  createProofSBNFT: (args: CreateProofSBNFTArgs) => Promise<CreateProofSBNFTResult>;
  revokingProof: boolean;
  proofCreated: boolean;
  creatingProof: boolean;
  createProofStatement: (args: CreateProofStatementArgs) => Promise<CreateProofStatementResult>;
  creatingProofStatement: boolean;
  proofStatementCreated: boolean;

  loadingMyProofs: boolean;
  proofData: ProofData | null;
  myProofs: ProofData[] | null;
  proofDataProofStatement: null | IdProofOutput;
  loadMyProofs: () => Promise<ProofData[]>;
  revokeProof: (args: {id: string}) => Promise<void>;

  loadProof: (id: string) => Promise<any>;
} | null;

const CCDContext = React.createContext<CCDContextData>(null);

const CONTRACT_INDEX: bigint = BigInt(process.env.REACT_APP_CONTRACT_INDEX ?? 4321);
// const CONTRACT_SUB_INDEX = 0;

export const CCDContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const dispatch = useDispatch();
  const [account, setAccount] = useState<string>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [_provider, setProvider] = useState<WalletApi | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [contract] = useState<ContractFacade>(createContractInterface({
    CONTRACT_NAME: "mysomeid",
    CONTRACT_INDEX,
  }));
  const [loadingMyProofs, setLoadingMyProofs] = useState(false);
  const [myProofs, setMyProofs] = useState<ProofData[]>(null);
  const [proofCreated, setProofCreated] = useState(false);
  const [creatingProof, setCreatingProof] = useState(false);
  const [proofData, setProodData] = useState<ProofData|null>(null);
  const [proofDataProofStatement, setProofDataProofStatement] = useState<IdProofOutput | null>(null);
  const [revokingProof, setRevokingProof] = useState(false);
  const [{creatingProofStatement, proofStatementCreated}, setProofStateInfo] = useState({
    creatingProofStatement: false,
    proofStatementCreated: false,
  });
  const [mintTxs, setMintTxs] = useState<MintTx[] | null>(null);
  const [addedMintTxsInfoToMyProofs, setAddedMintTxsInfoToMyProofs] = useState(false);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [tsCreated] = useState(new Date().getTime());

  // Detect when the Concordium wallet is installed.
  useInterval(() => {
    if ( installed !== null ) {
      return;
    }

    // Give Concordium 1,5 second to initialise the API.
    if ( (window as any).concordium === undefined && new Date().getTime() - tsCreated < 1500 ) {
      return;
    }

    setInstalled(!!(window as any).concordium);
  }, 100, true);

  const _getTransactions = useCallback(async (accountAddress: string, limit: number = 1000, order: 'ascending' | 'descending' = 'descending', from: string | null = null): Promise<WalletProxyTransaction[]> => {
    const proxyPath =
      `/wallet/${accountAddress}/txs?limit=${limit}&order=${order}&includeRawRejectReason${from ? `&from=${from}` : ''}`;
    const baseUrl = process.env.REACT_APP_EXPLORER_URL ?? "https://wallet-proxy.testnet.concordium.com";
    const {
      transactions
    } = await fetch(
        serviceUrl(proxyPath),
        {method: 'GET', headers: { 'Content-Type': 'application/json' }}
      )
      .then(res => res.json());
    return transactions ?? [];
  }, [isConnected, account]);
  
  // debugger;
  useEffect(() => {
    if ( !mintTxs || !myProofs || addedMintTxsInfoToMyProofs ) {
      return;
    }
    setAddedMintTxsInfoToMyProofs(true);
    const updatedProofs = myProofs.map( p => {
      if ( !p || !p.id ) {
        return p;
      }
      const mintTx = mintTxs.find( x => x.tokenId === p.id );
      if ( mintTx ) {
        p.created = Math.round(mintTx.tx.blockTime ?? 0);
        p.tx = mintTx.tx.transactionHash;
      }
      return p;
    }).sort((a, b) => {
      if ( a.created && b.created ) {
        return b.created - a.created;
      }
      return 0;
    });
    setMyProofs(updatedProofs);
  }, [mintTxs, myProofs, addedMintTxsInfoToMyProofs]);

  const handleSetAccountAndConnected = useCallback((accountAddress: string | undefined) => {
    console.log("Connected with wallet address : " + accountAddress);
    setAccount(accountAddress);
    setIsConnected(!!accountAddress);
    if ( accountAddress ) {
      (async () => {
        let more = true;
        let from = 0;
        const txs = await _getTransactions(accountAddress, 1000, 'descending', from ? from.toString() : null);
        const mintTxs = txs.map( tx => {
          const evt: string | null = tx.details?.description === 'Invoke smart contract' &&
                                  tx.details?.events?.length === 1 ? tx.details?.events[0] : null;

          if (!evt ||
              evt.indexOf('function= mint') === -1 ||
              evt.indexOf('contract= mysomeid') === -1 ||
              evt.indexOf(`target=<${CONTRACT_INDEX}, 0>`) === -1 ) {
            return null;
          }

          const message = evt.split("message=")[1]?.trim();
          if ( !message ) {
            console.error("Mint nft event contained no message");
            return null;
          }

          const mlen = message?.length;
          if ( mlen !== 978 ) {
            console.error(`Unexpected message length (${mlen})`);
          }

          const buf = toBuffer(message, 'hex');
          let s = '';
          for(let i=37; i<37+8; i++ ) {
            s += String.fromCharCode(buf.at(i));
          }
          const ret: MintTx = {
            tokenId: s,
            tx,
          };
          return ret;
        }).filter( x => !!x );
        mintTxs.forEach( x => {
          if ( x.tx.blockTime < from || !from ) {
            from = x.tx.blockTime;
          }
        } );
        console.log("adding tx ", mintTxs.map(x => x.tokenId));
        setMintTxs(mintTxs);
        setAddedMintTxsInfoToMyProofs(false);
      })().then().catch(err => {
        console.error(err);
      });
    } else {
      setMyProofs(null);
      setMintTxs(null);
    }
  }, [account]);

  const connect = useCallback(
    () => {
      // debugger;
      detectConcordiumProvider()
        .then((provider) => {
          // debugger;
          provider.connect().then(handleSetAccountAndConnected);
          return provider;
        });
    },
    []
  );

  const disconnect = useCallback(() => {
    detectConcordiumProvider()
        .then((provider) => {
          // debugger;
          return provider;
        });
    // TODO: Implment disconnection here.
  }, []);


  const createProofStatement = useCallback(async (args: CreateProofStatementArgs): Promise<CreateProofStatementResult> => {
    const {
      platform,
      userData,
      account,
    } = args ?? {};

    if ( !account ) {
      throw new Error('Not connected to wallet');
    }

    const provider = (await detectConcordiumProvider()) as any;

    // createProofStatement
    // debugger;

    const {
      statement
    } = await fetch(
        serviceUrl(`/proof/statement`, ''),
        {method: 'GET', headers: { 'Content-Type': 'application/json' }}
      )
      .then(res => res.json());

    const {
      challenge,
    } = await fetch(serviceUrl(`/proof/challenge`, {
                                                  platform,
                                                  userData,
                                                }),
                                                {
                                                  method: 'GET',
                                                  headers: {
                                                    'Content-Type': 'application/json'
                                                  }
                                                })
      .then(res => res.json());

    let proof: IdProofOutput | null = null;

    try { 
      proof = await provider.requestIdProof(account, statement, challenge);
      // debugger;
    } catch(e) {
      console.error(e);
      throw e;
    }

    if ( proof ) {
      // Verify that the proof is OK.
      const response = await fetch(serviceUrl(`/proof/verify`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challenge, proof, account }),
      });
      
      if ( response.status !== 200 ) {
        throw new Error("Internal server error : " + response.status );
      }

      const body = await response.json();
      console.log("body ", body);

      if (!body.result) {
        console.error("Proof deemed invalid", { challenge, proof, account });
        return null; 
      }

      console.log("Proof created!", body);
    }

    if ( proof ) {
      setProofDataProofStatement(proof);
    }

    return {
      challenge, 
      proof,
    };
  }, [account]);

  const createProofSBNFT = useCallback(async ({firstName, surName, userData, challenge, platform, proof}: CreateProofSBNFTArgs): Promise<CreateProofSBNFTResult> => {
    if ( creatingProof ) {
      throw new Error('Already creating proof');
    }

    // const provider = await detectConcordiumProvider();
    const uid = new ShortUniqueId({ length: 8 });
    const proofId = uid();

    if ( proof.credential.length !== 96 ) {
      throw new Error('Invalid length of credential');
    }

    if ( proof.proof.value.proofs.length !== 2 ) {
      throw new Error('Invalid proof.');
    }

    if ( proofId.length !== 8 ) {
      throw new Error('Invalid token id');
    }

    const dt = new Date().getTime();

    // TODO: Use this end-point to substidise paying for the 
    // nft to be created.
    let response = await fetch(
      serviceUrl(`/proof/${proofId}/nft`, ''),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          surName,
          platform,
          userData,
          account,
          challenge,
          proof,
        }),
      }
    );

    if ( response.status !== 200 ) {
      throw new Error('Failed to store proof (1)');
    }

    const {status /*, tx: txHash*/ } = await response.json();
    let tx: string | undefined;

    if ( status === 'mint-yourself' ) {
      const firstNameProof = proof.proof.value.proofs[0].proof;
      const lastNameProof = proof.proof.value.proofs[1].proof;
  
      tx = await contract.mint(
        account,
        {
          "owner": {
            "Account": [account]
          },
          "token": proofId,
          "platform": platform,
          "credential": proof.credential,
          "challenge": challenge,
          "first_name": firstName,
          "last_name": surName,
          "user_data": userData,
          "proofs": [
            [AttributesKeys.firstName, firstNameProof], 
            [AttributesKeys.lastName, lastNameProof],
          ],
        },
      );
  
      await contract.waitForTX(tx);        
    } else {
      /*
        psudo impl:
        while( status === 'minting' ) {
          sleep(5000);
          status = (await fetch('/mint-status').then(ret => ret.json() )).status;
        }
        tx = txHash;
      */
      throw new Error('Not implemented yet');
    }

    // Loading takes at least 2 seconds.
    const diff = 2000 - (new Date().getTime() - dt);
    if ( diff > 0 ) {
      await new Promise<void>(cb => setTimeout(cb, diff));
    }

    // Create new proof data struct.
    const newProof: ProofData = {
      id: proofId,
      platform,
      firstName,
      lastName: surName,
      userData,
      proof,
      tx,
      created: Math.round(new Date().getTime() / 1000),
      meta: {
        credential: proof.credential,
        challenge: challenge,
        proofs: [
          [AttributesKeys.firstName, proof.proof.value.proofs[0].proof], 
          [AttributesKeys.lastName, proof.proof.value.proofs[1].proof],
        ],
      }
    };
    
    // Add to the list.
    const updatedProofsList = [
      newProof,
      ...(myProofs ?? []),
    ];

    setMyProofs(updatedProofsList);

    return {
      newProof,
      myProofs: updatedProofsList,
    };
  }, [account, myProofs, contract, creatingProof]);

  const revokeProof = useCallback(async ({id: tokenId}: {id: string}) => {
    if ( !contract ) {
      throw new Error('No contract');
    }

    if ( !account ) {
      throw new Error('No account');
    }

    const dt = new Date().getTime();

    const tx = await contract.burn(
      account,
      {
        "token": tokenId,
      }
    );
    console.log("created revoke tx : " + tx);
    // https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=1992421279116d6948ecb9e6f1b8248fbf11677b50c0b580b0cbfac9dd38d5ac

    await contract.waitForTX(tx);

    // we cannot "load" for less than 2 seconds;
    const diff = 2000 - (new Date().getTime() - dt);
    if( diff > 0 ) {
      await new Promise<void>(cb => setTimeout(cb, diff));
    }

    setMyProofs((myProofs ?? []).filter(({id}) => id !== tokenId));
  }, [contract, account]);

  const loadMyProofs = useCallback(async () => {
    if ( myProofs !== null && myProofs.length > 0 ) {
      return myProofs; // ignoring loading them again when they have first been loaded.
    }
    const tokens = await contract.ownTokens(account);
    setMyProofs(tokens.map(([id, metaData]) => {
      const {
        challenge,
        credential,
        proofs,
        revoked
      } = metaData;
      const proof: ProofData = {
        id,
        revoked: !!revoked ? 1 : 0,
        meta: {
          challenge,
          credential,
          proofs,
        }
      };
      return proof; 
    }));
  }, [account, contract, myProofs]);

  /*detectConcordiumProvider().then(provider => {
    provider.
  }).*/

  const loadProof = useCallback(async (id: string) => {
    if ( !id ) {
      throw new Error('No id');
    }
    const url = serviceUrl(`/proof/${id}/nft`, '');
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    if ( response.status !== 200 ) {
      throw new Error('Failed to get proof');
    }
    const data = await response.json();
    if (!data ){
      throw new Error('Failed loading proof');
    }
    return data;
  }, []);

  useEffect(() => {
    detectConcordiumProvider()
      .then(provider => {
        setProvider(provider);
        provider.on('accountChanged', a => {
          console.log("CCD: Account Changed : " + a);
          handleSetAccountAndConnected(a ?? undefined);
        });
        provider.on('accountDisconnected', () => {
          console.log("CCD: Account disconnected");
          handleSetAccountAndConnected(undefined);
          // provider.getMostRecentlySelectedAccount().then(handleGetAccount)
        });
        provider.on('chainChanged', (chain) => {
          console.log("CCD: Chain changed", chain);
          setChain(chain);
        });
        // Check if you are already connected
        provider.getMostRecentlySelectedAccount().then(handleSetAccountAndConnected);
      })
      .catch(() => handleSetAccountAndConnected(undefined));
  }, []);

  const value: CCDContextData = useMemo(() => ({
    isConnected,
    account,
    provider: _provider,
    connect,
    disconnect,
    chain,
    contract,
    revokingProof,
    createProofSBNFT,
    creatingProof,
    proofCreated,
    createProofStatement,
    creatingProofStatement,
    proofStatementCreated,
    proofData,
    loadMyProofs,
    revokeProof,
    myProofs,
    proofDataProofStatement,
    loadingMyProofs,
    loadProof,
    installed,
  }), [
    isConnected,
    account,
    _provider,
    connect,
    disconnect,
    chain,
    contract,
    createProofSBNFT,
    revokingProof,
    creatingProof,
    proofCreated,
    createProofStatement,
    creatingProofStatement,
    proofStatementCreated,
    proofData,
    loadMyProofs,
    revokeProof,
    myProofs,
    proofDataProofStatement,
    loadingMyProofs,
    loadProof,
    installed,
  ]);

  return <CCDContext.Provider {...{value}}>{children}</CCDContext.Provider>;
};

export const useCCDContext = () => {
  const ccdContext = useContext(CCDContext);
  if (!ccdContext) {
    throw new Error(
      "useCCDContext() can only be used inside of <CCDContextProvider />",
    );
  }
  // const { isConnected, account, handleConnect, provider, } = ccdContext;
  // return useMemo<CCDContextData>(() => ({ isConnected, account, provider, handleConnect }), [ccdContext]);
  return useMemo<CCDContextData>(() => (ccdContext), [ccdContext]);
};

