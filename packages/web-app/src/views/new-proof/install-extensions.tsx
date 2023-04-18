import {
  Button,
} from 'src/components';
import {
  Typography,
  Box,
} from "@mui/material";
// import logo from 'src/images/mysomeid-logo.svg';
import {
  extensionUrl,
  ccdExtensionUrl
} from 'src/constants';
import {
  useExtension
} from 'src/hooks/use-extension';
import smallScreenshot from './small-screenshot.png';
import { useCCDContext } from 'src/hooks';

const MySoMeExtNeeded = () => {
  return (
    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
      <Typography variant="h3" display="block"><strong>Get started with the MYSOME Extension</strong></Typography>
      <Typography variant="h6" display="block" gutterBottom sx={{marginTop: '8px', maxWidth: '65%', textAlign: 'center'}}>
        Install the MYSOME Browser Extension to secure your Social Media profile.
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
            Install Extension
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const CCDExtNeeded = () => {
  return (
    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
      <Typography variant="h3" display="block"><strong>Install the Concordium Wallet</strong></Typography>
      <Typography variant="h6" display="block" gutterBottom sx={{marginTop: '8px', maxWidth: '65%', textAlign: 'center'}}>
        Install the Concordium Wallet extension to provide your identity.
      </Typography>
      <Box sx={{marginTop: '24px', display: 'flex',  width: '100%', justifyContent: 'center'}}>
        <Box sx={{    
          display: 'flex', flex: 1, flexGrow: 1, widthg: '100%', justifyContent: 'center',
        }}>
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
            window.open(ccdExtensionUrl, '_blank');
          }}>
            Install Wallet
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export const InstallExtensions = ({children}: {children: any}) => {
  const {installed: browserExtInstalled} = useExtension();
  const {installed: ccdBrowserExtInstalled} = useCCDContext();

  // Render nothing still determining if the extensions are installed.
  if ( browserExtInstalled === null || ccdBrowserExtInstalled === null ) {
    return null;
  }

  if ( browserExtInstalled && ccdBrowserExtInstalled ) {
    return children;
  }

  if ( !ccdBrowserExtInstalled ) {
    return <CCDExtNeeded />;
  } 

  return <MySoMeExtNeeded />;
};
