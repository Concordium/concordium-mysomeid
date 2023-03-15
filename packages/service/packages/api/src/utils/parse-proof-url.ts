import {
  parse as parseUrl
} from 'url';

import {
  isValidUrl
} from './is-valid-url';

// TODO: Put in shared lib.
export function parseMySoMeProofUrl(s: string): {
  error?: string,
  id?: string,
  platform?: string,
  userData?: string,
} {
  if ( !isValidUrl(s) ) {  
    return {
      error: 'Not a valid url',
    };
  }

  const url = parseUrl(s);
  console.log(url);

  
  // console.log("asdsadasdasd");
  const {
    host,
    pathname,
    query,
  } = url ?? {};

  // console.log("asdsadasdasd");
  // console.log("query" , query);

  const queryMap: Record<string, string | undefined> | undefined = query?.split('&').filter(x => !!x).reduce((acc, it) => {
    const [key, val] = it.split('=');
    const tmp: Record<string, string | undefined> = {
      ...acc,
      ...(key ? {[key]: val ?? undefined,} : {})
    };
    return tmp;
  }, {} as Record<string, string | undefined>);

  const userData = queryMap?.u ?? 'Undefined Undefined'; // default to something.
  const platform = queryMap?.p ?? 'li'; // default to linkedin

  // hostname ok = 
  if ( ['app.mysomeid.dev', host === 'mysome.id', host === 'mysomeid.dev'].indexOf(host?.toLowerCase() ?? '') === -1 ) {
    return {
      error: 'Invalid domain'
    };
  }

  const components = (pathname?.split('/') ?? []).filter(x => !!x);
  console.log('components', components);
  if ( (components?.length ?? 0) !== 2 ) {
    return {
      error: 'Invalid url',
    };
  }

  if ( (components?.length ?? 0) === 2 && ['v', 'view'].indexOf( components?.[0] ?? '' ) === -1 ) {
    return {
      error: 'Invalid path',
    };
  }

  if ( !userData ) {
    return  {
      error: 'no userdata'
    };
  }

  if ( !platform ) {
    return  {
      error: 'no platform'
    };
  }

  const id = components[1] ?? '';
  // console.log("id id id ", id);

  return {
    error: !id ? 'No proof in url' : undefined,
    id,
    platform,
    userData,
  };
}

export function alertDelay(s: string, d: number) {
  setTimeout( () => {
    alert(s);
  }, d );
}

export function sleep(n: number) {
  return new Promise<void>(resolve => setTimeout(resolve, Math.abs(n)));
}

