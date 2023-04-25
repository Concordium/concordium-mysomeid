import React, {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  serviceUrl,
  proofViewUrlBase
} from "src/constants";
import { useExtension } from "./use-extension";

type VerifyProofArgs = {url: string, userData: string} | {id: string, decryptionKey: string, userData: string};

export type VerifyProofResult = 'valid' | 'revoked' | 'invalid' | 'user-data-not-matching';

export type APIContextData = {
  verifyProof: (args: VerifyProofArgs) => Promise<VerifyProofResult>;
} | null;

const APIContext = React.createContext<APIContextData>(null);

export const APIContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const extension = useExtension();

  const verifyProof = useCallback(async (args: VerifyProofArgs): Promise<VerifyProofResult> => {
    const {
      id,
      decryptionKey,
    } = 'url' in args ? {id: args.url.split('/')[4], decryptionKey: args.url.split('/')[5]} : args;

    if (!id || !decryptionKey) {
      return 'invalid';
    }

    const uri = 'url' in args ? args.url : [proofViewUrlBase,id, decryptionKey].join('/');

    const responseData = await fetch(
      serviceUrl(`/proof/nft/${id}/${encodeURIComponent(decryptionKey)}`, ''),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if ( responseData.status !== 200 ) {
      throw new Error(`Failed loading proof (${responseData.status})`);
    }

    const proofData = await responseData.json();

    if (proofData.revoked) {
      return 'revoked';
    }

    // use the user data case insensitive.
    if (args.userData?.trim()?.toLowerCase() !== proofData.userData?.trim()?.toLowerCase() ) {
      return 'user-data-not-matching';
    }

    const proofUrl = encodeURIComponent(uri);
    const firstName = encodeURIComponent(proofData.firstName);
    const surName = encodeURIComponent(proofData.surName);
    const platform = encodeURIComponent(proofData.platform);
    const userData = encodeURIComponent(proofData.userData);

    const responseVerify = await fetch(
      serviceUrl(`/proof/validate-proof-url?url=${proofUrl}&firstName=${firstName}&lastName=${surName}&platform=${platform}&userData=${userData}`),
      {
        method: 'GET',  
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if ( responseVerify.status !== 200 ) {
      throw new Error(`Failed verifying proof (${responseData.status})`);
    }

    const resultVerify = await responseVerify.json();
    
    return resultVerify?.status === 'valid' ? 'valid' : 'invalid';
  }, []);

  const value: APIContextData = useMemo(() => ({
    verifyProof
  }), [
    verifyProof
  ]);

  return <APIContext.Provider {...{value}}>{children}</APIContext.Provider>;
};

export const useAPI = () => {
  const apiContext = useContext(APIContext);
  if (!apiContext) {
    throw new Error(
      "useAPI() can only be used inside of <APIContextProvider />",
    );
  }
  return useMemo<APIContextData>(() => apiContext, [apiContext]);
};

