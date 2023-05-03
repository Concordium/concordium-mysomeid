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
import createContractInterface, { ContractFacade } from 'src/contract/mysomeid-contract';
import { AttributesKeys, IdProofOutput /*, TransactionEvent*/ } from "@concordium/common-sdk";
import {
  serviceUrl
} from "src/constants";
import {
  useInterval
} from 'use-interval';
import { useExtension } from "./use-extension";
import { isNil, sleep } from '../utils';

export type ProofData = {
  id?: string;
  userData?: string; // linkedin username or other unique platform specific user info.
  proof?: IdProofOutput;
  platform?: 'li' | string;
  revoked?: 1 | 0;
  created?: number;
  firstName?: string;
  lastName?: string;
  tx?: string;
  decryptionKey?: string;
  profileImageUrl?: string;
  profileBackgroundUrl?: string;
  meta?: {
    challenge?: string;
    credential?: string;
    proofs?: [number, string][];
  };
};

type CreateProofSBNFTArgs = {
  firstName: string;
  surName: string;
  userId: string;
  proof: IdProofOutput;
  platform: "li";
  statementInfo: any;
  challenge: string;
  profileImageUrl: string;
  profileBackgroundUrl: string;
};

type CreateProofSBNFTResult = {
  newProof: ProofData;
  myProofs: ProofData[];
};

type CreateProofStatementResult = {
  challenge: string;
  proof: IdProofOutput | null;
  statement: any;
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
  eventTime: string;
  eventType: string;
  owner: string;
  timestamp: number;
  tokenId: number;
  txHash: string;
}

type MintTx = {
  tokenId: string;
  tx: WalletProxyTransaction;
};

export type CCDContextData = {
  installed: boolean | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  connectAsync: () => Promise<string>;
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
  loadMyProofs: (addr: string) => Promise<ProofData[]>;
  revokeProof: (args: {id: string}) => Promise<void>;

  loadProof: (id: string, decryptionKey: string) => Promise<any>;

  loadProofMetadata: (id: string) => Promise<any>;
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
  const [proofData, setProodData] = useState<ProofData | null>(null);
  const [proofDataProofStatement, setProofDataProofStatement] = useState<IdProofOutput | null>(null);
  const [revokingProof, setRevokingProof] = useState(false);
  const [{ creatingProofStatement, proofStatementCreated }, setProofStateInfo] = useState({
    creatingProofStatement: false,
    proofStatementCreated: false,
  });
  const [mintTxs, setMintTxs] = useState<MintTx[] | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [tsCreated] = useState(new Date().getTime());
  const extension = useExtension();

  // Detect when the Concordium wallet is installed.
  useInterval(() => {
    if (installed !== null) {
      return;
    }

    // Give Concordium 1,5 second to initialise the API.
    if ((window as any).concordium === undefined && new Date().getTime() - tsCreated < 1500) {
      return;
    }

    setInstalled(!!(window as any).concordium);
  }, 100, true);

  const _getTransactions = useCallback(async (accountAddress: string): Promise<WalletProxyTransaction[]> => {
    let responseTxs = await fetch(
      serviceUrl(`/wallet/txs/${accountAddress}`, ''),
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if ( responseTxs.status !== 200 ) {
      throw new Error(`Failed to get transactions (${responseTxs.status})`);
    }

    const responseTxsJson = await responseTxs.json();

    return responseTxsJson?.events ?? [];
  }, [isConnected, account]);

  useEffect(() => {
    if (!mintTxs || !myProofs) {
      return;
    }
    setMyProofs(myProofs.map(p => {
      if (!p || p.id === undefined) {
        return p;
      }
      const mintTx = mintTxs.find(x => x.tokenId === p.id);
      if (mintTx) {
        p.created = Math.round(mintTx.tx.timestamp ?? 0);
        p.tx = mintTx.tx.txHash;
      } else {
        console.log(" no mint tx with id ", p.id);
      }
      return p;
    }).sort((a, b) => {
      if (a.created && b.created) {
        return b.created - a.created;
      }
      return 0;
    }));
  }, [mintTxs?.length, myProofs?.length]);

  const handleSetAccountAndConnected = useCallback((accountAddress: string | undefined) => {
    console.log("Connected with wallet address : " + accountAddress);
    setAccount(accountAddress);
    setIsConnected(!!accountAddress);

    if ( accountAddress ) {
      (async () => {;
        setLoadingMyProofs(true);
        loadMyProofs(accountAddress).then();

        const txs = await _getTransactions(accountAddress);
        const mintTxs = txs.filter(x => x.eventType === 'mint')
          .map(tx => {
            const ret: MintTx = {
              tokenId: tx.tokenId.toString(),
              tx,
            };
            return ret;
          }).filter( x => !!x );
        setMintTxs(mintTxs);
      })().then().catch(err => {
        console.error(err);
      });
    } else {
      setMyProofs(null);
      setMintTxs(null);
      setLoadingMyProofs(false);
    }
  }, [account]);

  const connect = useCallback(
    () => {
      detectConcordiumProvider()
        .then((provider) => {
          provider.connect().then(handleSetAccountAndConnected);
          return provider;
        });
    },
    []
  );

  const [connecting, setConnecting] = useState(false);

  const connectAsync = useCallback(async () => {
    if ( isConnected ) {
      return account;
    }

    if (connecting) {
      console.warn('Already connecting');
    }

    setConnecting(true);
    const addr = await new Promise<string>((resolve, reject) => {
      detectConcordiumProvider().then((provider) => {
        provider.connect().then(addr => {
          resolve(addr);
        }).catch(e => {
          setConnecting(false);
          reject(e);
        });
      }).catch(e => {
        setConnecting(false);
        reject(e);
      });
    });

    handleSetAccountAndConnected(addr);
    setConnecting(false);

    return addr;
  }, [connecting, isConnected, account]);

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

    if (!account) {
      throw new Error('Not connected to wallet');
    }

    const provider = (await detectConcordiumProvider()) as any;

    const {
      statement
    } = await fetch(
      serviceUrl(`/proof/statement`, ''),
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
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
    } catch (e) {
      console.error(e);
      throw e;
    }

    if (proof) {
      // Verify that the proof is OK.
      const response = await fetch(serviceUrl(`/proof/verify`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challenge, proof, account }),
      });

      if (response.status !== 200) {
        throw new Error("Internal server error : " + response.status);
      }

      const body = await response.json();
      console.log("body ", body);

      if (!body.result) {
        console.error("Proof deemed invalid", { challenge, proof, account });
        return null;
      }

      console.log("Proof created!", body);
    }

    if (proof) {
      setProofDataProofStatement(proof);
    }

    return {
      challenge,
      proof,
      statement,
    };
  }, [account]);

  const createProofSBNFT = useCallback(async ({
    firstName,
    surName,
    userId,
    challenge,
    platform,
    proof,
    profileImageUrl,
    profileBackgroundUrl
  }: CreateProofSBNFTArgs): Promise<CreateProofSBNFTResult> => {
    if (creatingProof) {
      throw new Error('Already creating proof');
    }

    if ( !firstName ) {
      throw new Error('No first name given');
    }

    if ( !surName ) {
      throw new Error('No surname given');
    }

    if ( proof.credential.length !== 96 ) {
      throw new Error('Invalid length of credential');
    }

    if (proof.proof.value.proofs.length !== 2) {
      throw new Error('Invalid proof.');
    }

    // Use this end-point to substidise paying for the nft to be created.
    let response = await fetch(
      serviceUrl(`/proof/nft`, ''),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account,
          platform,
          firstName,
          surName, 
          userData: userId,
          challenge,
          proof,
        }),
      }
    );

    if ( response.status !== 200 ) {
      throw new Error(`Failed to store proof (${response.status})`);
    }

    const { decryptionKey, transactionHash } = await response.json();

    await contract.waitForTX(transactionHash);

    // Get the event data
    let event: any;
    let cnt = 0;
    while (cnt++ < 10) {
      if (cnt > 1) {
        await sleep(1000);
      }

      const responseTxs = await fetch(
        serviceUrl(`/wallet/txs/${account}`, ''),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (responseTxs.status !== 200) {
        continue;
      }

      const responseTxsJson = await responseTxs.json();
      event = responseTxsJson.events.find(x => x.txHash === transactionHash && x.eventType === 'mint');
      if (event?.tokenId) {
        break;
      }
    }

    // Return the tokenId.
    if (event?.tokenId === undefined) {
      throw new Error('Failed to get event : ' + transactionHash);
    }

    // Create new proof data struct.
    const newProof: ProofData = {
      id: event.tokenId,
      platform,
      firstName,
      lastName: surName,
      userData: userId,
      proof,
      decryptionKey,
      tx: transactionHash,
      created: Math.round(new Date().getTime() / 1000),
      profileImageUrl,
      profileBackgroundUrl,
      meta: {
        credential: proof.credential,
        challenge: challenge,
        proofs: [
          [AttributesKeys.firstName, proof.proof.value.proofs[0].proof],
          [AttributesKeys.lastName, proof.proof.value.proofs[1].proof],
        ],
      }
    };

    await extension.storeProof(newProof);

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

  const revokeProof = useCallback(async ({ id: tokenId }: { id: string }) => {
    if (!contract) {
      throw new Error('No contract');
    }

    const address = account ? account : await connectAsync();

    if (!address) {
      throw new Error('Not connected to wallet / No account');
    }

    const dt = new Date().getTime();

    const tx = await contract.burn(
      address,
      tokenId
    );

    await contract.waitForTX(tx);

    // we cannot "load" for less than 2 seconds;
    const diff = 2000 - (new Date().getTime() - dt);
    if (diff > 0) {
      await new Promise<void>(cb => setTimeout(cb, diff));
    }

    setMyProofs((myProofs ?? []).filter(({ id }) => id !== tokenId));
  }, [contract, account]);

  const loadMyProofs = useCallback(async (addr: string) => {
    while( loadingMyProofs ) {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }

    if ( myProofs !== null && myProofs.length > 0 ) {
      return myProofs; // ignoring loading them again when they have first been loaded.
    }

    setLoadingMyProofs(true);

    const tokens = await contract.listOwnedTokens(addr);

    const newList = tokens.map(id => {
      const proof: ProofData = {
        id,
        revoked: null,
        meta: null
      };
      return proof;
    });

    // Fetch the list of stored proofs and if there is stored data that is not undefined
    // which is undefined for the own token we will reuse that data.
    // Note that we discard any stored proofs which is not returned for the current wallet.
    const proofs = await extension.getStoredProofs();
    console.log("Stored proofs ", proofs);
    Object.entries(proofs).forEach(([id, storedProof]) => {
      const index = newList.findIndex(x => x.id !== undefined && x.id === id);
      if (index >= 0) {
        const existing = newList[index];
        Object.keys(storedProof).forEach(key => {
          if (!isNil(storedProof[key]) && isNil(existing[key])) {
            existing[key] = storedProof[key];
          }
        });
        newList[index] = existing;
      }
    });

    setMyProofs(newList);
    setLoadingMyProofs(false);
  }, [account, contract, myProofs]);

  const loadProof = useCallback(async (id: string, decryptionKey: string) => {
    if (!id) {
      throw new Error('No id');
    }

    if (!decryptionKey) {
      throw new Error('No decryptionKey given');
    }

    const storedData: any = {
    };

    const storedProof = await extension.getStoredProof(id);
    if (storedProof) {
      storedData.profileImageUrl = storedProof.profileImageUrl;
      storedData.profileBackgroundUrl = storedProof.profileBackgroundUrl;
    } else {
      console.log('Cannot find stored proof ', storedProof );
    }

    const response = await fetch(
      serviceUrl(`/proof/nft/${id}/${encodeURIComponent(decryptionKey)}`, ''),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed loading proof (${response.status})`);
    }

    const proofData = await response.json();

    return {
      ...storedData,
      proofData,
    }
  }, []);

  const loadProofMetadata = useCallback(async (id: string) => {
    if (!id) {
      throw new Error('No id');
    }

    const response = await fetch(
      serviceUrl(`/proof/nft/${id}`, ''),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed loading proof (${response.status})`);
    }

    const proofMetaData = await response.json();

    return proofMetaData;
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
    isConnecting: connecting,
    account,
    provider: _provider,
    connect,
    connectAsync,
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
    loadProofMetadata,
    installed,
  }), [
    isConnected,
    connecting,
    account,
    _provider,
    connect,
    connectAsync,
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
    loadProofMetadata,
    installed,
  ]);

  return <CCDContext.Provider {...{ value }}>{children}</CCDContext.Provider>;
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

