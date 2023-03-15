import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

import {
  sleep
} from './utils';

import {
  getAPIBaseUrl
} from './config';

export type ProofOracleValidationData = {
  error?: string;
  reason?: string;
  data: {}
  platform: 'li';
  userData: string;
  firstName: string;
  surName: string;
  country: string;
  platformUri: string;
  profilePicUri: string;
  revoked: boolean;
  valid: boolean;
  date: number;
};

export type ProofOracleValidateRequestStatus = {
  status: string;
  error: string;
  payload: ProofOracleValidationData;
};

export type ProfileInfoData = {
  id: string;
  status: string | null;
  profileExists: boolean | null;
  profileInfo: {
    onlyUrl?: boolean | undefined;
    name: string;
    profileImage: string | null;
    backgroundImage: string | null;
  };
  url: string;
};

export type APIData = {
  getOracleValidationLoading: boolean;
  getValidationFromProfileUrlWithOracle: (url: string) => Promise<ProofOracleValidationData>;
  getValidationFromUserDataWithOracle: (args: {proofUrl: string, proofId: string, platform: 'li', firstName: string, lastName: string, userData: string}) => Promise<ProofOracleValidationData>;
  getProfileInfoByUrlWithOracle: (profileUrl: string) => Promise<ProfileInfoData>;
  getQRCodeOfUrlsByUrlWithOracle: (imageUrls: string[]) => Promise<string | null>;
};

const APIContext = createContext<APIData>({} as any as APIData);

const validateRequest = async (uri: string): Promise<ProofOracleValidationData> => {
  const url = `${getAPIBaseUrl()}/proof/oracle/validate?url=${encodeURIComponent(uri)}`;
  console.log("GET (validate)", url);
  const {
    id
  } = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(res => res.json()).catch(e => {
    console.error("Error validating request", e);
    throw e;
  })

  if (!id) {
    throw new Error('');
  }

  let done = false;
  const ts = new Date().getTime();
  let ret: ProofOracleValidationData | undefined;
  let errorCount = 0;
  while( !done ) {
    if ( new Date().getTime() - ts > 60000 * 5 ) {
      throw new Error('Timed out');
    }

    const url = `${getAPIBaseUrl()}/proof/oracle/validate/${id}/status`;
    console.log("GET (status) ", url);
    const requestStatus = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .catch(e => {
      console.error("Error ", e);
      errorCount++;
    });

    if ( errorCount >= 3 ) {
      throw new Error('Failed to fetch.');
    }

    if ( requestStatus?.status === 'done' ) {
      ret = requestStatus.payload;

      break;
    }

    await new Promise<any>(resolve => setTimeout(resolve, 5000));
  }

  console.log("Verification result: ", ret);

  if (!ret ) {
    throw new Error('Failed to get result');
  }

  return ret;
}

export const APIProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [getOracleValidationLoading, setGetOracleValidationLoading] = useState(false);

  const getValidationFromProfileUrlWithOracle = useCallback(async (url: string) => {
    return new Promise<ProofOracleValidationData>((resolve, reject) => {
      setGetOracleValidationLoading(true);
      const ts = new Date().getTime();
      // Avoid flaky UX if end up returning too fast.
      const minLoadingTime = 2000;

      validateRequest(url)
        .then((data: ProofOracleValidationData) => {
          let diff = minLoadingTime - (new Date().getTime() - ts);
          if ( diff < 0 ) {
            diff = 0;
          }
          sleep(diff + Math.round(diff * 0.01)).then(() => {
            console.log("Proof oracle data result", data);
            resolve(data);
          });
        })
        .catch(err => {
          console.error(err);
          let diff = minLoadingTime - (new Date().getTime() - ts);
          if ( diff < 0 ) {
            diff = 0;
          }
          sleep(diff + Math.round(diff * 0.01)).then(() => {
            reject(err);
          });
        })
        .finally(() => {
          let diff = minLoadingTime - (new Date().getTime() - ts);
          if ( diff < 0 ) {
            diff = 0;
          }
          sleep(diff).then(() => {
            setGetOracleValidationLoading(false);
          });
        });
    });
  }, []);

  const getProfileInfoByUrlWithOracle = useCallback(async (profileUrl: string): Promise<ProfileInfoData> => {
    const url = `${getAPIBaseUrl()}/platform/profile-info?url=${encodeURIComponent(profileUrl)}`;
    console.log("GET (profile from url)", url);
    const {
      id
    } = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json()).catch(e => {
      console.error("Error validating request", e);
      throw e;
    })
  
    if (!id) {
      throw new Error('');
    }
  
    let done = false;
    const ts = new Date().getTime();
    let ret: ProfileInfoData | undefined;
    let errorCount = 0;
    while( !done ) {
      if ( new Date().getTime() - ts > 60000 * 5 ) {
        throw new Error('Timed out');
      }
  
      const url = `${getAPIBaseUrl()}/platform/profile-info/${id}/status`;
      console.log("GET (status) ", url);
      const requestStatus = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      .then(res => {
        return res.json();
      })
      .catch(e => {
        console.error("Error", e);
        errorCount++;
      });
  
      if ( errorCount >= 3 ) {
        throw new Error('Failed to fetch.');
      }
  
      if ( requestStatus?.status === 'done' ) {
        ret = requestStatus;
  
        break;
      }
  
      await new Promise<any>(resolve => setTimeout(resolve, 5000));
    }
  
    console.log("Profile info: ", ret);
  
    if (!ret ) {
      throw new Error('Failed to get result');
    }
  
    return ret;
  }, []);

  const getQRCodeOfUrlsByUrlWithOracle = useCallback(async (imageUrls: string[]): Promise<string | null> => {
    const url = `${getAPIBaseUrl()}/qr/image/scan?urls=${encodeURIComponent(imageUrls.join('|'))}`;
    console.log("GET (fetch qr code from images)", url);

    const {
      result
    } = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .catch(e => {
      console.error("Error validating request", e);
      throw e;
    });
  
    return result ?? null;
  }, []);

  const getValidationFromUserDataWithOracle = useCallback(async (args: {proofUrl: string, proofId: string, platform: 'li', firstName: string, lastName: string, userData: string}): Promise<ProofOracleValidationData> => {
    const {proofUrl, platform, firstName, lastName, userData} = args;
    const url = `${getAPIBaseUrl()}/proof/validate?url=${encodeURIComponent(proofUrl)}&firstName=${firstName}&lastName=${lastName}&platform=${platform}&userData=${userData}`;

    let err = false;
    const {
      status,
      id
    } = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .catch(e => {
      console.error("Error validating request", e);
      err = true;
      throw e;
    });

    const ret: ProofOracleValidationData = {
      error: err ? 'Connection error' : undefined,
      data: {},
      platform,
      userData,
      firstName,
      surName: lastName,
      country: '',
      platformUri: 'https://linkedin.com/in/' + userData + '/',
      valid: status === 'valid',
      revoked: status === 'invalid',
      profilePicUri: '',
      date: 0, 
    };

    return ret;
  }, []);

  const value = useMemo<APIData>(() => ({
    getOracleValidationLoading,
    getValidationFromProfileUrlWithOracle,
    getValidationFromUserDataWithOracle,
    getQRCodeOfUrlsByUrlWithOracle,
    getProfileInfoByUrlWithOracle,
  }), [
    getOracleValidationLoading,
    getValidationFromProfileUrlWithOracle,
    getValidationFromUserDataWithOracle,
    getQRCodeOfUrlsByUrlWithOracle,
    getProfileInfoByUrlWithOracle,
  ]);

  return <APIContext.Provider {...{value}}>{children}</APIContext.Provider>;
};

export function useAPI(): APIData {
  const context = useContext(APIContext);

  if (!context) {
    throw new Error(
      "useAPI() can only be used inside of <APIProvider />",
    );
  }

  return useMemo<APIData>(() => (context), [context]);
}

