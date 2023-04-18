import {
  useCallback,
  useState,
} from 'react';
import {
  Button,
} from 'src/components';
import {
  Typography,
  Box,
} from "@mui/material";
import logo from 'src/images/mysomeid-logo.svg';
import {
  extensionUrl,
} from 'src/constants';
import {
  useExtension
} from 'src/hooks/use-extension';
import smallScreenshot from './small-screenshot.png';

export const InstallExtensions = ({children}: {children: any}) => {
  const {installed: browserExtInstalled} = useExtension();

  const [shipInstallExt, setShipInstallExt] = useState(false);

  const skipInstallExt = useCallback(() => {
    setShipInstallExt(true);
  }, []);

  if ( browserExtInstalled === null ) {
    return null;
  }

  // window.concordium
  if ( (browserExtInstalled !== null && browserExtInstalled) || shipInstallExt ) {
    return children;
  }

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
      <Typography variant="h3" display="block"><strong>Fast track with browser Extension</strong></Typography>
      <Typography variant="h6" display="block" gutterBottom sx={{marginTop: '8px', maxWidth: '65%', textAlign: 'center'}}>
        Install the optional MYSOME Browser Extension to speed up securing your SoMe profile.
        <br/>
        Supported by Chrome, Brave, Edge and Opera.
      </Typography>
      <Box sx={{display: 'flex', marginTop: '32px'}}>
        <Box sx={{
          display: 'flex',
          flex: 1,
        }} >
          <Box sx={{  
            display: 'flex',
            flexGrow: 1,
            minWidth: '140px',
            minHeight: '140px',
            marginRight: '6%',
            background: `url(${smallScreenshot})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
          }} style={{backgroundPositionX: 'right'}} />
        </Box>
        <Box sx={{
          display: 'flex',
          flex: 1,
        }}>
          <Typography variant="h6" display="block" gutterBottom sx={{
            display: 'flex',
            flex: 1,
            marginLeft: '6%',
            maxWidth: '90%',
            textAlign: 'left'
          }}>
            Pro Tip!
            <br/>
            The browser extension automatically detects fake mySoMe proofs {':)'}
          </Typography>                    
        </Box>
      </Box>
      <Box sx={{marginTop: '24px', display: 'flex',  width: '100%', justifyContent: 'center'}}>
        <Box sx={{    
          display: 'flex', flex: 1, flexGrow: 1, widthg: '100%', justifyContent: 'center',
        }}>
          {/*<Button variant="ghost" sx={{
            display: 'flex',
            flex: 1,
            fontSize: '16px !important',
            color: 'rgb(48,53,73)',
            minWidth: '100px',
            marginLeft: '8px',
            maxWidth: '175px',
            padding: '6px 16px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }} disableRipple onClick={skipInstallExt}>
            Skip
          </Button>*/}
          <Button sx={{
            display: 'flex',
            flex: 1,
            fontSize: '16px !important',
            background: 'rgb(31,34,70)',
            color: 'white',
            minWidth: '100px',
            marginLeft: '8px',
            maxWidth: '175px',
            padding: '6px 16px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }} disableRipple onClick={() => {
            window.open(extensionUrl, '_blank');
          }}>
            Install extension
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
