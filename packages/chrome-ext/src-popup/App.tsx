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

// import logo from './logo.svg';
import logo from './title-logo.png';

import {
	EnvironmentTypes,
  webAppBaseUrlFromEnvironment,
  serviceBaseUrlFromEnvironment,
  webAppHomeUrlFromEnvironment,
} from '@mysomeid/chrome-ext-shared';

import {
  themeSX
} from './theme';

import {storage} from './utils';

declare var chrome: any;

// When the popup is shown the the current page is linkedin we dont actually show anythign but we just send
// a message to the page to open up a popup on the page.
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

const PrimaryButton = ({onClick, children}: {onClick: () => void, children?: any}) => {
  return (
    <Button {...{onClick}} disableRipple sx={{
      background: themeSX.colors.buttomBGPrimary,
      borderRadius: '100px',
      height: '42px',
      padding: `0px ${themeSX.size.s2}`,
      color: 'white',
      '&:hover': {
        background: themeSX.colors.buttomBGPrimaryHover,
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

// eslint-disable-next-line no-empty-pattern
const Loading = ({}) => {
  return (
    <Box sx={{
      color: '#292929',
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

createWidgetMessageHandler((m: any) => {
  console.log("Widget: on message - todo handle it" , m);
});

const Welcome = ({gettingStarted}: {gettingStarted: () => void}) => {
  return <>
    <Box key="welcome-1" sx={{display: 'flex', flexDirection: 'column', paddingTop: themeSX.size.s3, textAlign: 'center' }}>
      <Typography sx={themeSX.text.h2} component="h2">
        Secure your social media profiles
      </Typography>
      <Typography sx={{...themeSX.text.medium, marginTop: themeSX.size.s3, padding: `0px ${themeSX.size.s2}`}}>
        Avoid identity theft and fraud by using your identity on the Concordium blockchain to issue a self-sovereign badge of authenticity.
      </Typography>
    </Box>,
    <Box key="welcome-2" sx={{padding: `0px ${themeSX.size.s2}`, display: 'flex', marginTop: 'auto', marginBottom: '20px', justifyContent: 'center' }}>
      <PrimaryButton onClick={gettingStarted}>GETTING STARTED</PrimaryButton>
    </Box>
  </>;
};

const getNextEnvironment = (e: EnvironmentTypes) => {
  const arr = ['dev', 'test-net', 'main-net'];
  const i = arr.indexOf(e);
  if ( i === -1 ) {
    throw new Error('Invalid environment: ' + e);
  }
  const newIndex = (i + 1) % arr.length;
  return arr[newIndex];
};

const DebugView = (args: any) => {
  const [environment, setEnvironment] = useState<EnvironmentTypes | null>(null);
  const [verbose, setVerbose] = useState<boolean | null>(null);
  useEffect(() => {
    storage.get('environment').then((value) => {
      setEnvironment(value);
    }).catch(console.error);
    storage.get('verbose').then((value) => {
      setVerbose(!!value);
    }).catch(console.error);
  }, []);

  const cycleEnvironment = useCallback(() => {
    if ( environment === null ) {
      console.error('Ignored so far.');
      return;
    }
    const nextEnv = getNextEnvironment(environment);
    storage.set('environment', nextEnv).then(() => {
      storage.get('environment').then((value) => {
        setEnvironment(value);
      }).catch(console.error);
    }).catch(console.error);
  }, [environment]);

  return (
    <Box padding={themeSX.size.s2} display="flex" flexDirection="column">
      <Typography sx={{
        ...themeSX.text.medium,
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Debug mode
      </Typography>
      <Typography sx={{
        ...themeSX.text.medium,
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Verbose: {!!verbose ? 'Yes' : 'No'} 
      </Typography>
      <Typography sx={{
        ...themeSX.text.medium,
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Environment: {environment ? environment : 'Unknown'}  
      </Typography>
      <Typography sx={{
        ...themeSX.text.medium,
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        Web App URL: {environment ? webAppBaseUrlFromEnvironment(environment) : 'Unknown'}  
      </Typography>
      <Typography sx={{
        ...themeSX.text.medium,
        lineHeight: '6px',
        marginBottom: '13px',
      }}>
        API URL: {environment ? serviceBaseUrlFromEnvironment(environment) : 'Unknown'}  
      </Typography>
      <Button onClick={cycleEnvironment}>Change Environment</Button>
    </Box>
  );
};

const Header = ({logoClick}: any) => {
  return (
    <Box sx={{width: '100%', height: '131px', background: themeSX.colors.headerBG, borderRadius: '7px'}}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '32px',
      }}>
        <Box sx={{display: 'flex'}} onClick={logoClick}>
          <img src={logo} alt="logo" style={{
            height: '22vmin',
            marginTop: '-4px',
            pointerEvents: 'none',
          }}/>
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
  const [environment, setEnvironment] = useState<EnvironmentTypes | null>(null)

  useEffect(() => {
    storage.get('environment').then((value) => {
      setEnvironment(value);
    }).catch(console.error);
  }, []);

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
    if  (!environment ) {
      throw new Error('Cannot open getting started as Environment is not initialised yet');
    }
    chrome.tabs.create({url: webAppHomeUrlFromEnvironment(environment)});
  }, [environment]);

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
        setIsOnMySOMEUrl((url ?? '').indexOf('app.mysomeid.dev') >= 0 || (url ?? '').indexOf('app.testnet.mysome.id') >= 0 || (url ?? '').indexOf('app.mysome.id') >= 0 || ( environment && (url ?? '').indexOf('http://localhost:3000') >= 0));
      }, 1);
    };
    chrome.tabs.query({ active: true, currentWindow: true }, callback);
  }, [hasInitUrl, environment]);

  const loading = !hasInitStorage || !hasInitUrl;
  const isOnKnownUrl = isOnLinkedIn || isOnMySOMEUrl;
  return (
    <Centered>
      <Box sx={{display: 'flex', flexDirection: 'column', width: '366px', padding: '3px', height: '575px', background: themeSX.colors.panelBG, borderRadius: themeSX.size.s1}}>
        <Header {...{logoClick}}/>
        {loading ? <Loading /> : undefined}
        {!debugMode && !loading && !isOnKnownUrl ? <Welcome {...{gettingStarted}} /> : undefined }
        {debugMode && !loading ? <DebugView /> : undefined}
      </Box>
    </Centered>
  );
}

export default App;