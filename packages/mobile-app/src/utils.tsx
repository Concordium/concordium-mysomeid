import {parse as parseUrl} from 'url';

export const isValidUrl = (urlString: string) => {
  const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

export function parseMySoMeProofUrl(s: string): {
  error?: string,
  id?: string,
} {
  if ( !isValidUrl(s) ) {  
    return {
      error: 'Not a valid url',
    };
  }

  const url = parseUrl(s);
  console.log(url);

  const {
    host,
    pathname,
    query,
  } = url ?? {};
  
  // hostname ok = 
  if ( ['app.mysomeid.dev', host === 'mysome.id', host === 'mysomeid.dev'].indexOf(host?.toLowerCase() ?? '') === -1 ) {
    return {
      error: 'Invalid domain'
    };
  }

  const queryMap: Record<string, string | undefined> | undefined = query?.split('&').filter(x => !!x).reduce((acc, it) => {
    const [key, val] = it.split('=');
    const tmp: Record<string, string | undefined> = {
      ...acc,
      ...(key ? {[key]: val ?? undefined,} : {})
    };
    return tmp;
  }, {} as Record<string, string | undefined>);

  const components = (pathname?.split('/') ?? []).filter(x => !!x);
  console.log('components?.length', components);
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

  const id = components?.[1] ?? '';

  return {
    error: !id ? 'No proof in url' : undefined,
    id,
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

// Takes whatever text and parses a valid linkedin profile url
export const parseValidLinkedInUrl = (s: string): string | null => {
  let validUrlFound = isValidUrl(s) && s.indexOf('linkedin') >= 0 && s.indexOf('/in/') > 0;
  let url: string | null = null;
  if ( !validUrlFound ) {
    url = s.match((/(https?:\/\/[^\s]+)/i))?.[1] ?? null;
    if (!!url) {
      validUrlFound = isValidUrl(url) && url.indexOf('linkedin') >= 0 && url.indexOf('/in/') > 0;
    }
  } else {
    url = s;
  }

  if ( url ) {
    const components = url.split('/');
    const index = components.findIndex(x => x === 'in');
    if ( index === -1 || !components[index+1]) {
      url = null;
    } else {
      // make the url standardised.
      url = `https://www.linkedin.com/in/${components[index+1]}/`;
    }
    console.log("LinkedUrl parsed : " + url + " in text " + s);
  }

  return url;
}

