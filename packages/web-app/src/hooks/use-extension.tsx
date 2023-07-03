// import { useLocation } from 'react-router-dom';
import {
  FC,
  createContext,
  useMemo,
  useContext,
  ReactElement,
  useState,
  useCallback,
  useEffect
} from 'react';

import { ProofData } from './use-ccd-context';

type Registration = {
  platform: 'li';
  step: number;
  username: string;
  userData: string;
  url: string;
  image: string;
  proofId: string;
  backgroundImage: string;
};

type ProofMap = Record<string, ProofData>;

export type ExtensionData = {
  installed: boolean | null;  
  setQRUrl: (platform: string, profileId: string, url: string) => void;
  updateRegistration: (args: Registration) => Promise<boolean>;
  getRegistrations: () => Promise<any>;

  sendMessage: (to: string, type: string, payload: any) => void;
  sendMessageWResponse: (to: string, type: string, payload: any) => Promise<any>;

  startRegistration: (profileInfo: {platform: string}) => void;

  openLinkedInSinceRegistrationIsDone: (profilePageUrl: string) => void;

  getStoredProofs: () => Promise<ProofMap>;
  getStoredProof: (id: string) => Promise<ProofData>;
  storeProof: (proofData: ProofData) => Promise<void>;
  updateProofProperty: (id: string, key: string, value: any) => Promise<void>;

  reloadTabs: (args: {contains: string}) => Promise<any>;
} | null;

type MySoMeAPI = {
  createButton(): void;
  sendMessage(to: string, type: string, payload: any): void;
  updateReg(obj: any): Promise<void>;
  getRegistrations(): Promise<any>;
  sendMessage: (to: string, type: string, payload: any) => void;
  sendMessageWResponse: (to: string, type: string, payload: any) => Promise<any>;
  createPlatformRequest: (platform: string, request: 'fetch-profile') => Promise<any>;
  getStateValue: (store: string, key: string) => Promise<any | null>;
  setStateValue: (store: string, key: string, value: any) => Promise<any | null>;
  reloadTabs: (args: {contains: string}) => Promise<any>;
};

const ExtensionContext = createContext<ExtensionData>(null);

const getSDK = () => {
  const mysomeSDKObject = (window as any).mysome as MySoMeAPI;
  return mysomeSDKObject;
};

export const ExtensionProvider: FC<{ children: ReactElement }> = ({ children }) => {
  const [installed, setInstalled] = useState(null);
  const [tsCreated] = useState(new Date().getTime());

  // Use interval to detect when/if the plugin/mysome SDK has been installed into the page.
  useEffect(() => {
    const intervalFunc = setInterval(() => {
      const mysomeSDKObject = getSDK();

      // Wait for a little while to ensure that extension injects the mysome SDK.
      if ( !mysomeSDKObject && (new Date().getTime() - tsCreated < 500) ) {
        return;
      }

      if ( installed && !mysomeSDKObject ) {
        console.warn("MYSOME SDK object lost");
      }

      if ( !installed && mysomeSDKObject ) {
        console.log("MYSOME SDK object aquired");
        setInstalled(true);
      }
    }, 100);

    return () => clearInterval(intervalFunc);
  }, [installed, tsCreated]);

  const setQRUrl = useCallback( (platform: string, profileId: string, url: string) => {
    if ( !getSDK() ) {
      console.error("Cannot find mysome.id extension.");
      return;
    }
    getSDK().sendMessage('background', 'set-proof-info', {
      url,
      platform,
      profileId,
    });
  }, [] );

  const updateRegistration = useCallback(async (reg: Registration): Promise<boolean> => {
    console.log("Updated registration ", reg);

    // Storing in local storage is good but can fail.
    try {
      localStorage.setItem("reg_store_bg_" + reg.proofId, reg.backgroundImage );
    } catch(e) {
      console.error(e);
    }

    if ( !getSDK() ) {
      console.error("Cannot find mysome.id extension.");
      return false;
    }

    await getSDK().updateReg(reg);

    return !!getSDK();
  }, []);

  const getRegistrations = useCallback(async (): Promise<any> => {
    if ( !getSDK() ) {
      console.error("Cannot find mysome.id extension.");
      return null;
    }

    const result = await getSDK().getRegistrations();
    return result;
  }, []);

  const reloadTabs = useCallback(async (args: {contains: string}): Promise<any> => {
    if ( !getSDK() ) {
      console.error("Cannot find mysome extension.");
      return null;
    }

    const result = await getSDK().reloadTabs(args);
    return result;
  }, []);

  const sendMessage = (to: string, type: string, payload: any) => {
    if ( !getSDK() ) {
      console.error("Cannot find mysome.id extension.");
      return;
    }
    getSDK().sendMessage(to, type, payload);
  };
 
  const sendMessageWResponse = async (to: string, type: string, payload: any): Promise<any> => {
    if ( !getSDK() ) {
      console.error("Cannot find mysome.id extension.");
      return;
    }
    return getSDK().sendMessage(to, type, payload);
  };

  const startRegistration = (platformInfo: {platform: string}) => {
    // platformInfo
    if ( platformInfo?.platform !== 'li' ) {
      throw new Error('invalid platform : ' + platformInfo?.platform);
    }

    (async () => {
      await getSDK().createPlatformRequest(platformInfo?.platform, 'fetch-profile');
    })();
    
    setTimeout(() => {
      window.location.href = 'https://linkedin.com';
    }, 1000);
  };

  const openLinkedInSinceRegistrationIsDone = (profilePageUrl: string) => {
    setTimeout(() => {
      // window.location.href = profilePageUrl; 
      getRegistrations().then(_regs => {
        window.location.href = profilePageUrl;
      });
    }, 1000);
  };

  const getStoredProofs = useCallback(async (): Promise<ProofMap> => {
    let cnt = 0;
    while( !getSDK() && cnt ++ < 3 ) {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
    if ( !getSDK() ) {
      console.error("failed to get stored proods, no mysome extension found.");
      return {};
    }
    const proofs = await getSDK().getStateValue('proofs', 'set') ?? {};
    return proofs as ProofMap;     
  }, []);

  const getStoredProof = useCallback(async (id: string): Promise<ProofData | null> => {
    let cnt = 0;
    while( !getSDK() && cnt ++ < 3 ) {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
    if ( !getSDK() ) {
      console.error("Failed to get stored proof - cannot find mysome sdk");
      return null;
    }
    const proofs = await getSDK().getStateValue('proofs', 'set') ?? {};
    const proof = proofs[id] ?? null;
    return proof as ProofMap | null;
  }, []);

  const storeProof = useCallback( async (proofData: ProofData) => {
    let cnt = 0;
    while( !getSDK() && cnt ++ < 3 ){
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
    if ( !getSDK() ) {
      console.error("Failed to store proof - cannot find mysome sdk");
      return;
    }
    if (proofData.id === undefined) {
      throw new Error('Invalid proof id');
    }
    const proofs = await getSDK().getStateValue('proofs', 'set') ?? {};
    console.log("proofs before ", {proofs});
    proofs[proofData.id] = proofData;
    console.log("proofs after ", {proofs});
    await getSDK().setStateValue('proofs', 'set', proofs);
  }, []);

  const updateProofProperty = useCallback(async (id: string, key: string, value: any) => {
    let cnt = 0;
    while( !getSDK() && cnt ++ < 3 ){
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }
    if ( !getSDK() ) {
      return;
    }
    const proofs = await getSDK().getStateValue('proofs', 'set') ?? {};
    const proof = proofs[id] ?? {};
    proof[key] = value;
    proofs[id] = proof;
    await getSDK().setStateValue('proofs', 'set', proofs);
  }, []);

  const value: ExtensionData = useMemo(() => ({
    installed,
    setQRUrl,
    updateRegistration,
    getRegistrations,
    sendMessage,
    sendMessageWResponse,
    startRegistration,
    openLinkedInSinceRegistrationIsDone,
    getStoredProofs,
    getStoredProof,
    storeProof,
    updateProofProperty,
    reloadTabs,
  }), [
    installed,
    setQRUrl,
    updateRegistration,
    getRegistrations,
    sendMessage,
    sendMessageWResponse,
    startRegistration,
    openLinkedInSinceRegistrationIsDone,
    getStoredProofs,
    getStoredProof,
    storeProof,
    updateProofProperty,
    reloadTabs,
  ]);

  return <ExtensionContext.Provider {...{value}}>{children}</ExtensionContext.Provider>;
};

export function useExtension() {
  const context = useContext(ExtensionContext);

  if (!context) {
    throw new Error(
      "useExtension() can only be used inside of <ExtensionProvider />",
    );
  }

  return useMemo<ExtensionData>(() => (context), [context]);
}
