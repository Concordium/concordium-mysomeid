import React, {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  serviceUrl,
  proofViewUrlBase,
  proofBaseUri
} from "src/constants";
import { useExtension } from "./use-extension";

type VerifyProofArgs = {id: string, decryptionKey: string, userData: string};

export type VerifyProofResult = 'valid' | 'revoked' | 'invalid' | 'user-data-not-matching' | 'no-connection';

export type APIContextData = {
  verifyProof: (args: VerifyProofArgs) => Promise<VerifyProofResult>;
  fuzzyNameMatch: (nameToTest: string, proofFirstName: string, proofLastName: string) => Promise<{matching: boolean}>;
} | null;

const APIContext = React.createContext<APIContextData>(null);

export const APIContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const extension = useExtension();

  const verifyProof = useCallback(async ({id, decryptionKey, userData}: VerifyProofArgs): Promise<VerifyProofResult> => {
    if (!id || !decryptionKey || !userData) {
      return 'invalid';
    }

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

    // use the user data case insensitive.
    if (userData?.trim()?.toLowerCase() !== proofData.userData?.trim()?.toLowerCase() ) {
      return 'user-data-not-matching';
    }

    if (proofData.revoked) {
      return 'revoked';
    }

    const proofUrlEnc = encodeURIComponent([proofBaseUri, 'v', id, encodeURIComponent(decryptionKey)].join('/'));
    const nameEnc = encodeURIComponent([proofData.firstName, proofData.surName].join(' '));
    const platformEnc = encodeURIComponent(proofData.platform);
    const userDataEnc = encodeURIComponent(proofData.userData);

    const responseVerify = await fetch(
      serviceUrl(`/proof/validate`, {url: proofUrlEnc, name: nameEnc, platform: platformEnc, userData: userDataEnc}, 'v2'),
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

  const fuzzyNameMatch = async (nameTest: string, proofFirstName: string, proofLastName: string): Promise<{matching: boolean}> => {
    const responseData = await fetch(
      serviceUrl(`/names/match`, {
        soMeName: nameTest,
        idName: [proofFirstName, proofLastName].join(' '),
      }),
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

    const response = await responseData.json();
    
    return {
      matching: response.matching,
    };
  };

  const value: APIContextData = useMemo(() => ({
    verifyProof,
    fuzzyNameMatch
  }), [
    verifyProof,
    fuzzyNameMatch,
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

