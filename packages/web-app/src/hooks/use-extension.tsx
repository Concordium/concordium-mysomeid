// import { useLocation } from 'react-router-dom';
import {
  FC,
  createContext,
  useMemo,
  useContext,
  ReactElement,
  useState,
  useCallback
} from 'react';

import {
  useInterval
} from 'use-interval';

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

export type ExtensionData = {
  installed: boolean | null;  
  setQRUrl: (platform: string, profileId: string, url: string) => void;
  updateRegistration: (args: Registration) => Promise<boolean>;
  getRegistrations: () => Promise<any>;

  sendMessage: (to: string, type: string, payload: any) => void;
  sendMessageWResponse: (to: string, type: string, payload: any) => Promise<any>;

  startRegistration: (profileInfo: {platform: string}) => void;

  openLinkedInSinceRegistrationIsDone: (profilePageUrl: string) => void;
} | null;

type MySoMeAPI = {
  createButton(): void;
  sendMessage(to: string, type: string, payload: any): void;
  updateReg(obj: any): Promise<void>;
  getRegistrations(): Promise<any>;
  sendMessage: (to: string, type: string, payload: any) => void;
  sendMessageWResponse: (to: string, type: string, payload: any) => Promise<any>;
  createPlatformRequest: (platform: string, request: 'fetch-profile') => Promise<any>;
};

const ExtensionContext = createContext<ExtensionData>(null);

export const ExtensionProvider: FC<{ children: ReactElement }> = ({ children }) => {
  const [installed, setInstalled] = useState(null);
  const [tsCreated, setTSCreated] = useState(new Date().getTime());
  const [mysome, setMySoMeAPI] = useState<MySoMeAPI | null>(null);

  // Use interval to detect when/if the plugin installs itself.
  useInterval(() => {
    const v = !!(window as any).mysome;
    if ( !v && (new Date().getTime() - tsCreated < 300) ) {
      // Wait for a little while to ensure that plugin gets time to be created.
      return;
    }
    if ( v !== installed ) {
      setInstalled(v);
      if ( v ) {
        setMySoMeAPI((window as any).mysome as MySoMeAPI);
      }
    }
  }, 100);

  const setQRUrl = useCallback( (platform: string, profileId: string, url: string) => {
    if ( !mysome ) {
      return;
    }
    mysome.sendMessage('background', 'set-proof-info', {
      url,
      platform,
      profileId,
    });
  }, [mysome] );

  /*{
    platform: 'li',
    step: 5,
    username: userData,
    url: profileImageUrl,
    image: dataUrl,
  }*/
  const updateRegistration = useCallback(async (reg: Registration): Promise<boolean> => {
    console.log("Updated registration ", reg);

    // Storing in local storage is good but can fail.
    try {
      localStorage.setItem("reg_store_bg_" + reg.proofId, reg.backgroundImage );
    } catch(e) {
      console.error(e);
    }

    if ( !mysome ) {
      console.error("Cannot find mysome extension.");
      return false;
    }

    await mysome.updateReg(reg);

    return !!mysome;
  }, [mysome]);

  const getRegistrations = async (): Promise<any> => {
    if ( !mysome ) {
      console.error("Cannot find mysome extension.");
      return null;
    }

    const result = await mysome.getRegistrations();
    return result;
  };

  const sendMessage = (to: string, type: string, payload: any) => {
    if ( !mysome ) {
      console.error("Cannot find mysome extension.");
      return;
    }
    mysome.sendMessage(to, type, payload);
  };
 
  const sendMessageWResponse = async (to: string, type: string, payload: any): Promise<any> => {
    if ( !mysome ) {
      console.error("Cannot find mysome extension.");
      return;
    }
    return mysome.sendMessage(to, type, payload);
  };

  const startRegistration = (platformInfo: {platform: string}) => {
    // platformInfo
    if ( platformInfo?.platform !== 'li' ) {
      throw new Error('invalid platform : ' + platformInfo?.platform);
    }

    (async () => {
      await mysome.createPlatformRequest(platformInfo?.platform, 'fetch-profile');
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

  const value: ExtensionData = useMemo(() => ({
    installed,
    mysome,
    setQRUrl,
    updateRegistration,
    getRegistrations,
    sendMessage,
    sendMessageWResponse,
    startRegistration,
    openLinkedInSinceRegistrationIsDone,
  }), [
    installed,
    mysome,
    setQRUrl,
    updateRegistration,
    getRegistrations,
    sendMessage,
    sendMessageWResponse,
    startRegistration,
    openLinkedInSinceRegistrationIsDone,
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
