import {
  useCallback,
  useEffect, useState
} from 'react';
import {
  Button,
} from 'src/components';
import {
  Typography,
  Box,
} from "@mui/material";
import {
  extensionUrl,
  ccdExtensionUrl
} from 'src/constants';
import {
  useExtension
} from 'src/hooks/use-extension';
import smallScreenshot from './small-screenshot.png';
import { useCCDContext } from 'src/hooks';
import { defaultFontFamily, primaryButtonBG } from 'src/themes/theme';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useSearchParams } from 'src/hooks/use-search-params';
import useInterval from 'use-interval';

const MySoMeExtNeeded = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
      <Typography variant="h3" fontFamily={defaultFontFamily} sx={{ fontWeight: 500 }} gutterBottom component="div">
        Get started with the mysome.id Extension
      </Typography>

      <Typography variant="subtitle1" gutterBottom component="div" sx={{marginTop: '8px', maxWidth: '65%', textAlign: 'center'}}>
        Install the mysome.id browser extension to secure your social media profile.
        <br/>
        Supported by Chrome, Brave, Edge and Opera.
      </Typography>

      <Box sx={{ display: 'flex', marginTop: '32px' }}>
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
          }} style={{ backgroundPositionX: 'right' }} />
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
            <br />
            The browser extension automatically detects fake mySoMe proofs {':)'}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ marginTop: '24px', display: 'flex', width: '100%', justifyContent: 'center' }}>
        <Box sx={{
          display: 'flex', flex: 1, flexGrow: 1, widthg: '100%', justifyContent: 'center',
        }}>
          <Button sx={{
            display: 'flex',
            flex: 1,
            fontSize: '16px !important',
            background: primaryButtonBG,
            color: 'white',
            minWidth: '100px',
            marginLeft: '8px',
            maxWidth: '175px',
            padding: '6px 16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontFamily: defaultFontFamily,
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
  const { installed } = useCCDContext();
  const searchParams = useSearchParams();

  const template = searchParams.get("template");

  const [timeShown, setTimeShown] = useState(new Date().getTime());

  const [refresh, setRefresh] = useState(!!searchParams.get("refresh"));

  const navigate = useNavigate();

  const startRefreshing = useCallback(() => {
    if (refresh) {
      return;
    }
    setRefresh(true);
    setTimeShown(new Date().getTime());
    navigate({
      pathname: '/create/1',
      search: `?${createSearchParams([
        ...(template ? [] : []),
        ['refresh', '1'],
      ])}`,
    });
  }, [refresh]);

  const checkRefresh = useCallback(() => {
    const timeNow = new Date().getTime();
    const delta = timeNow - timeShown;
    if ( delta > 8000 ) {
      window.location.reload();
    }
  }, [refresh, timeShown]);

  useInterval(() => {
    if (installed) {
      return;
    }
    if (!refresh) {
      return;
    }
    checkRefresh();
  }, 1000);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
      <Typography variant="h3" fontFamily={defaultFontFamily} sx={{ fontWeight: 500 }} gutterBottom component="div">
        Install the Concordium Wallet
      </Typography>
      <Typography variant="subtitle1" gutterBottom component="div" sx={{ textAlign: 'center' }}>
        Install the Concordium Wallet extension to provide your identity
      </Typography>
      <Box sx={{ marginTop: '24px', display: 'flex', width: '100%', justifyContent: 'center' }}>
        <Box sx={{
          display: 'flex', flex: 1, flexGrow: 1, widthg: '100%', justifyContent: 'center',
        }}>
          <Button sx={{
            display: 'flex',
            flex: 1,
            fontSize: '16px !important',
            background: primaryButtonBG,
            color: 'white',
            minWidth: '100px',
            marginLeft: '8px',
            maxWidth: '175px',
            padding: '6px 16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontFamily: defaultFontFamily,
          }} disableRipple onClick={() => {
            startRefreshing();
            window.open(ccdExtensionUrl, '_blank');
          }}>
            Install Wallet
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export const InstallExtensions = ({ children }: { children: any }) => {
  const { installed: browserExtInstalled } = useExtension();
  const { installed: ccdBrowserExtInstalled } = useCCDContext();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const refresh = !!searchParams.get("refresh");

  useEffect(() => {
    if (!ccdBrowserExtInstalled) {
      return;
    }
    if (!refresh) {
      return;
    }
    const search = window.location.search.replace('refresh=1&', '')
      .replace('refresh=1', '');
    navigate({
      pathname: '/create/1',
      search,
    });
  }, [ccdBrowserExtInstalled, refresh]);

  // Render nothing still determining if the extensions are installed.
  if (browserExtInstalled === null || ccdBrowserExtInstalled === null) {
    return null;
  }

  if (browserExtInstalled && ccdBrowserExtInstalled) {
    return children;
  }

  if (!browserExtInstalled) {
    return <MySoMeExtNeeded />;
  }

  return <CCDExtNeeded />;
};
