
export const environmentUrls = {
  development: 'http://localhost:4200', // development
  test: 'https://api.mysomeid.dev/v1', // public test
  lan: 'http://192.168.1.5:4200',
  production: (process.env as any).REACT_APP_API_BASE_URL ?? 'https://api.mysome.id/v1', // production
};

export let API_BASE_URL = (environmentUrls as any)[process.env.NODE_ENV ?? 'production'] as string;

export const getAPIBaseUrl = (): string => {
  return API_BASE_URL;
};

export const setNextAPIBaseUrl = (): string => {
  const vals = Object.values(environmentUrls);
  if ( vals.length === 0 ) {
    return API_BASE_URL;
  }
  let i  = vals.findIndex(x => x === getAPIBaseUrl());
  i++;
  if ( i >= vals.length ) {
    i = 0;
  }
  API_BASE_URL = vals[i];
  console.log(API_BASE_URL);
  return API_BASE_URL;
};