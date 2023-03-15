import React, { useCallback, useEffect, useState } from "react";

import {
  Box,
  Button,
  Typography
} from '@mui/material';

import {
  createWidgetMessageHandler,
  createMessage,
} from './messaging';

import logo from './logo.svg';
import greenCheck from './green-check.svg';
import greyCheck from './grey-check.svg';
import link from './ext-link.svg';

import {storage} from './utils';

import {config} from './config';

declare var chrome: any;

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  const url = tab?.[0]?.url;
  if ((url ?? '').indexOf('linkedin.com') >= 0 ) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      var activeTab = tabs[0];
      const message = createMessage('content', 'show-content-widget', {});
      chrome.tabs.sendMessage(activeTab.id, message);
      window.close();
    });
  }
});

const TextButton = ({onClick, children}: {onClick: () => void, children?: any}) => {
  return (
    <Button {...{onClick}} disableRipple sx={{
      background: 'transparent',
      borderRadius: '100px',
      height: '42px',
      padding: '0px 24px',
      color: 'black',
      '&:hover': {
        background: '#f7f7f7',
        color: 'black',

      },
    }}>
      {children}
    </Button>
  );
};

const PrimaryButton = ({onClick, children}: {onClick: () => void, children?: any}) => {
  return (
    <Button {...{onClick}} disableRipple sx={{
      background: '#1E2246',
      borderRadius: '100px',
      height: '42px',
      padding: '0px 24px',
      color: 'white',
      '&:hover': {
        background: '#1E2246',
        color: 'white',
        opacity: '0.8',
      }
    }}>
      {children}
    </Button>
  );
};

let dev = false;
let gDebugMode = false;

const Loading = ({}) => {
  return (
    <Box sx={{
      color: 'black',
      width: '100%',
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: '138px',
      left: '0',
      height: '400px',
      right: '0',
    }}>
      Loading
    </Box>
  );
};

const Centered = ({children}: {children: any}) => dev ? <Box sx={{
  position: 'fixed',
  left: 0, right: 0, top: 0, bottom: 0,
  background: 'grey',
  display: 'flex',
  alignItems: 'center',
  placeItems: 'center',
  justifyContent: 'center',
}}>{children}</Box> : children;

const messageHandler = createWidgetMessageHandler((m: any) => {
  console.log("Widget: on message - todo handle it" , m);
});

const Welcome = ({gettingStarted}: {gettingStarted: () => void}) => {
  return <>
    <Box key="welcome-1" sx={{display: 'flex', flexDirection: 'column', paddingTop: '24px', textAlign: 'center' }}>
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '28px', color: 'black'}}>
          Secure your social media profiles
      </Typography>
      
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '18px', color: 'black', marginTop: '24px', padding: '0px 16px'}}>
        Avoid identity theft and fraud by using your identity on the Concordium blockchain to issue a selv-soverign badge of authencitity.
      </Typography>
    </Box>,
    <Box key="welcome-2" sx={{padding: '0px 16px', display: 'flex', marginTop: 'auto', marginBottom: '20px', justifyContent: 'center' }}>
      <PrimaryButton onClick={gettingStarted}>GETTING STARTED</PrimaryButton>
    </Box>
  </>;
};

const PlatformLinkedIn = ({url}: {url: string}) => {
  const okayClicked = useCallback(() => {
    // chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      // var activeTab = tabs[0];
      // const message = createMessage('content', 'show-content-widget', {});
      // chrome.tabs.sendMessage(activeTab.id, message);
      // setTimeout(() => {
        window.close();
      // }, 1);
    // });
  }, []);
  return <>
    <Box key="welcome-1" sx={{display: 'flex', flexDirection: 'column', paddingTop: '24px', textAlign: 'center' }}>
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '28px', color: 'black'}}>
        Secure Your LinkedIn Profile
      </Typography>
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '18px', color: 'black', marginTop: '24px', padding: '0px 16px'}}>
        Get started or check the status of your or other Linked In profiles by clicking on the shield icon or the MYSOME.id badge located in the bottom left corner of LinkedIn.
      </Typography>
    </Box>,
    <Box key="welcome-2" sx={{padding: '0px 16px', display: 'flex', marginTop: 'auto', marginBottom: '20px', justifyContent: 'center' }}>
      <PrimaryButton onClick={okayClicked}>Okay</PrimaryButton>
    </Box>
  </>;
};

const MYSOMEPage = ({url}: {url: string}) => {
  const okayClicked = useCallback(() => {
    window.close();
  }, []);
  return <>
    <Box key="welcome-1" sx={{display: 'flex', flexDirection: 'column', paddingTop: '24px', textAlign: 'center' }}>
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '28px', color: 'black'}}>
        The MYSOME Dapp
      </Typography>
      <Typography sx={{fontFamily: 'ClearSans', fontSize: '18px', color: 'black', marginTop: '24px', padding: '0px 16px'}}>
        The Dapp allows you to issue a proof of ownership of your social media accounts<br/><br/>Use the Dapp to revoke and inspect your existing proofs.
      </Typography>
    </Box>,
    <Box key="welcome-2" sx={{padding: '0px 16px', display: 'flex', marginTop: 'auto', marginBottom: '20px', justifyContent: 'center' }}>
      <PrimaryButton onClick={okayClicked}>Okay</PrimaryButton>
    </Box>
  </>; 
};

const ListItem = ({displayName, ok, grey, url}: {displayName: string, ok: boolean, grey: boolean, url: string}) => {
  const openUrl = useCallback(() => {
    console.log("open url ", url);
    chrome?.tabs?.create({url});
  }, []);
  return (
    <Box display="flex" height="38px" width="100%" paddingLeft="8px" paddingRight="8px" alignItems="center" sx={{background: !grey ? 'transparent' : '#f8f8f8'}}>
      <Typography flex="1" sx={{fontSize: '18px', fontFamily: 'ClearSans', color: 'black', }}>{displayName}</Typography>
      <Box flex="0" sx={{display: 'flex', height: '18px', width: '18px', opacity: ok ? 1 : 0.25 }}>
        <img alt="img" src={ok ? greenCheck : greyCheck} />
      </Box>
      <Box component="button"
        flex="0"
        marginLeft="8px"
        onClick={openUrl}
        sx={{
          background: 'none',
          border: 'none',
          padding: '0',
          display: 'flex',
          height: '18px',
          width: '18px',
          cursor: 'pointer'
        }} >
        <img src={link} alt="img" style={{width: '18px', height: '18px'}} />
      </Box>
    </Box>
  );
};

const List = ({linkedInRegistered}: {linkedInRegistered: boolean}) => {
  let i = 0;
  return (
    <Box>
      <ListItem displayName="LinkedIn" ok={linkedInRegistered} grey={i++ % 2 == 1} url="https://www.linkedin.com/feed/" />
      <ListItem displayName="Facebook" ok={false} grey={i++ % 2 == 1} url="https://facebook.com" />
      <ListItem displayName="Twitter" ok={false} grey={i++ % 2 == 1} url="https://twitter.com" />
    </Box>
  );
};

const DebugView = (args: any) => {
  const [isStaging, setIsStaging] = useState<boolean | null>(null);
  useEffect(() => {
    storage.get('staging').then((value) => {
      setIsStaging(!!value);
    }).catch(console.error);
  }, []);
  const toggleStaging = useCallback(() => {
    if ( isStaging === null ) {
      console.error('Ignored so far.');
      return;
    }
    storage.set('staging', !isStaging).then(() => {
      storage.get('staging').then((value) => {
        if ( value === true || value === false ) {
          setIsStaging(value);
        } else {
          setIsStaging(false);
        }
      }).catch(console.error);
    }).catch(console.error);
  }, [isStaging]);

  return (
    <Box padding="16px" display="flex" flexDirection="column">
      <Typography sx={{
        fontFamily: 'ClearSans',
        fontSize: '17px',
        color: 'black',
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Debug mode
      </Typography>
      <Typography sx={{
        fontFamily: 'ClearSans',
        fontSize: '17px',
        color: 'black',
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Is Production: {isStaging === null  ? '?' : isStaging ? 'No' : 'Yes'}  
      </Typography>
      <Typography sx={{
        fontFamily: 'ClearSans',
        fontSize: '17px',
        color: 'black',
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Is Staging: {isStaging === null  ? '?' : !isStaging ? 'No' : 'Yes'}  
      </Typography>
      <Button onClick={toggleStaging}>Toggle Staging|Production</Button>
    </Box>
  );
};

const Header = ({logoClick}: any) => {
  return (
    <Box sx={{width: '100%', height: '131px', background: '#1F2348' , borderRadius: '7px'}}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '32px',
      }}>
        <Box sx={{display: 'flex'}} onClick={logoClick}>
          <img src={logo} className="App-logo" alt="logo" />
        </Box>

        <Box sx={{display: 'flex', flexDirection: 'column', marginLeft: '8px'}}>
          <Typography component="h2" sx={{
            fontFamily: 'ClearSans',
            fontSize: '32px',
            color: 'white',
          }}>
            MYSOME.ID
          </Typography>
          <Typography sx={{
            fontFamily: 'ClearSans',
            fontSize: '17px',
            color: 'white',
            lineHeight: '6px',
            marginBottom: '13px',
          }}>
            Browser Extension
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const App = () => {
  const [hasInitStorage, setInitStorage] = useState<boolean>(false);
  const [hasInitUrl, setHasInitUrl] = useState<boolean>(false); 
  const [hasShownWelcome, setHasShownWelcome] = useState(null);
  const [linkedInRegistered, setLinkedInRegistered] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [settingDebug, setSettingDebug] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [isOnLinkedIn, setIsOnLinkedIn] = useState<boolean | null>(null);
  const [isOnMySOMEUrl, setIsOnMySOMEUrl] = useState<boolean | null>(null);
  const [isStaging, setIsStaging] = useState<boolean | null>(null)

  useEffect(() => {
    if ( isStaging !== null ) {
      return;
    }
    storage.get('staging').then((value) => {
      setIsStaging(!!value);
    }).catch(console.error);
  }, [isStaging]);

  useEffect(() => {
    if ( hasInitStorage ) {
      return;
    }
    storage.init().then(() => {
      setInitStorage(true);
      storage.get('debug').then(value => {
        console.log("debug : " + value);
      }).catch(console.error);
    }).catch(console.error);
  }, [hasInitStorage]);

  useEffect(() => {
    if ( !hasInitStorage || hasShownWelcome !== null ) {
      return;
    }
    storage.get('shown-popup-welcome').then((value) => {
      console.log("Has shown welcome : " + value);
      setHasShownWelcome(value);
    }).catch(console.error);
  }, [hasInitStorage, hasShownWelcome]);

  useEffect(() => {
    if ( !hasInitStorage || linkedInRegistered !== null ) {
      return;
    }
    storage.get('linkedin.registered').then((value) => {
      setLinkedInRegistered(value);
    }).catch(console.error);
  }, [hasInitStorage, linkedInRegistered]);
  
  const gettingStarted = useCallback(() => {
    // setHasShownWelcome(true);
    // console.log("Setting shown welcome : true");
    // storage.set('shown-popup-welcome', true).then().catch(console.error);
    chrome.tabs.create({url: isStaging ? 'http://localhost:3000' : 'https://app.mysomeid.dev/home'});
  }, [isStaging]);

  const logoClick = useCallback(event => {
    if ( event.shiftKey && !settingDebug ) {
      setSettingDebug(true);
      storage.set('debug', !debugMode).then(() => {
        gDebugMode = !gDebugMode;
        setDebugMode(!debugMode);
      }).catch(console.error).finally(() => {
        setSettingDebug(false);
      })
    }
  }, [debugMode, settingDebug]);

  useEffect(() => {
    if (hasInitUrl) {
      return;
    }
    function callback (tab) {
      setTimeout(() => {
        const url = tab?.[0]?.url;
        console.log("Resolved URL ", url);
        setHasInitUrl(true);
        setUrl(url ?? '');
        setIsOnLinkedIn((url ?? '').indexOf('linkedin.com') >= 0);
        setIsOnMySOMEUrl((url ?? '').indexOf('mysomeid.dev') >= 0 || (url ?? '').indexOf('mysome.id') >= 0 || ( isStaging && (url ?? '').indexOf('http://localhost:3000') >= 0));
      }, 1);
    };
    chrome.tabs.query({ active: true, currentWindow: true }, callback);
  }, [hasInitUrl, isStaging]);

  const loading = !hasInitStorage || !hasInitUrl;
  const isOnKnownUrl = isOnLinkedIn || isOnMySOMEUrl;
  return (
    <Centered>  

      <Box sx={{display: 'flex', flexDirection: 'column', width: '366px', padding: '3px', height: '575px', background: 'white', borderRadius: '8px'}}>
        <Header {...{logoClick}}/>

        {loading ? <Loading /> : undefined}
        {!debugMode &&  !loading && isOnLinkedIn ? <PlatformLinkedIn {...{url}} /> : undefined }
        {!debugMode &&  !loading && isOnMySOMEUrl ? <MYSOMEPage {...{url}} /> : undefined }
        {!debugMode && !loading && !isOnKnownUrl ? <Welcome {...{gettingStarted}} /> : undefined }
        {debugMode && !loading ? <DebugView /> : undefined}
        

      </Box>
    </Centered>
  );
}

export default App;