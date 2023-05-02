import {
  Slide,
  useMediaQuery,
  useScrollTrigger,
  useTheme,
  Typography
} from '@mui/material';
import {
  Theme,
} from '@mui/material/styles';
import {
  makeStyles,
} from '@mui/styles';
import Box from '@mui/material/Box';
import {
  useState,
  useEffect
} from 'react';
import CCDLogo from 'src/images/ccd.png';
import MySoMeIDLogo1 from 'src/images/logo-white.svg';
import MySoMeIDLogo2 from 'src/images/logo-grey.svg';
import { Link } from 'react-router-dom';
import { useCCDContext } from 'src/hooks';
import TitleWhitePng from 'src/images/title-white.png';
import TitleBlackPng from 'src/images/title-black.png';
import PoweredByWhitePng from 'src/images/powered-by-white.png'
import PoweredByBlackPng from 'src/images/powered-by-black.png'
import { HtmlTooltip } from '../wizard/wizard-row';

const len = '0.2s';
const curve = 'cubic-bezier(0, 0, 0.2, 1)';
const transitionProps = `background-color ${len} ${curve},
                         height ${len} ${curve},
                         padding ${len} ${curve}
                         `;

const useStyles = makeStyles((theme: Theme) => {
  const headerHeight = 60;
  
  return ({
    header: {
      width: '100%',
      transform : 'none',
      position: 'fixed',
      top: 0,
      zIndex: theme.zIndex.appBar,
    },
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row', 
      justifyContent: 'space-between',
    },
    larger: {
      padding: '0px 50px',
      backgroundColor: "transparent",
      transition: transitionProps,
      height: `95px`,
    },
    smaller: {
      padding: '8px 8px 8px 20px',
      height: `${headerHeight}px`,
      backgroundColor: '#f9f9f9',
      transition: transitionProps,
    },
    logo: {
    },
    logoSmaller: {
      transform: 'scale(0.9)',
      marginTop: '5px', 
    },
    logoLarger: {
      transform: 'scale(1.1)',
    },
    buttonSmaller: {
      backgroundColor: '#bababa !important',
      color: 'white !important',
      "&:hover": {
        background: '#8a8a8a !important',
        color: 'white',
      },
    },
  })
});

const ConnectedStatusBadge = ({}) => {
  const {
    account,
    isConnected
  } = useCCDContext();
  const shortWalletDesc = isConnected ? '#' + [account.slice(0, 4), account.slice(-4)].join('...') : '';
  return (
    <Box sx={{
      p: '6px 8px',
      display: "inline-flex", 
      alignItems: "center", 
      justifyContent: "center", 
      position: "relative", 
      boxSizing: "border-box", 
      outline: "0px", 
      border: "0px", 
      margin: "0px", 
      userSelect: "none", 
      verticalAlign: "middle", 
      appearance: "none", 
      textDecoration: "none", 
      minWidth: "64px", 
      boxShadow: "none", 
      borderRadius: "8px",
      fontWeight: "500", 
      lineHeight: "1.5rem", 
      fontSize: "18px", 
      padding: "6px 12px", 
      color: "white", 
      backgroundColor: 'black',
      paddingLeft: '16px',
      paddingRight: '24px',
      paddingTop: '8px',
      paddingBottom: '8px',
    }}>
      <HtmlTooltip
        title={account}
      >
        <Box sx={{display: 'flex', flexDirection: 'row'}}>
          <Box component="img" src={CCDLogo} sx={{width: "32px", height: "32px", marginRight: '16px'}}/>
          <Box sx={{display: 'flex', flexDirection: 'column', marginTop: '1px'}}>
            {isConnected ?
              <Typography sx={{textAlign: 'center'}}>{shortWalletDesc}</Typography>
            : undefined}
            <Typography sx={{marginTop: '1px', textAlign: 'center'}}>
              {isConnected ? 'Wallet Connected' : 'Not Connected'}
            </Typography>
          </Box>
        </Box>
      </HtmlTooltip>
    </Box>
  );
};

export function AppHeader({isConnected, isInstalled, onToggleConnect}: {isConnected: boolean, isInstalled: boolean | null, onToggleConnect: () => void}) {
  const theme = useTheme();

  const md = useMediaQuery(theme.breakpoints.down('md'));
  
  const classes = useStyles();
  const [scrollTarget, setScrollTarget] = useState(undefined);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletWidgetOpen, setWalletWidgetOpen] = useState(false);

  const lt700 = useMediaQuery(theme.breakpoints.down(700));

  const shrink = useScrollTrigger({
    target: undefined,
    disableHysteresis: true,
    threshold: 30,
  });

  const hide = useScrollTrigger({threshold: 200});

  useEffect(() => {
    if (mobileMenuOpen && !md) {
      setMobileMenuOpen(false);
    }
    if (walletWidgetOpen) {
      setWalletWidgetOpen(false);
    }
  }, [md]);

  return (
    <Slide appear={false} direction="down" in={!hide}>
      <Box
        component="header"
        className={classes.header}
      >
        <Box id="header-client" className={[classes.container, shrink ? classes.smaller : classes.larger].join(' ')}>
          <Link to={'/home'} style={{textDecoration: 'none'}}>
            <Box id="logo-container" className={[classes.logo, shrink ? classes.logoSmaller : classes.logoLarger].join(' ')} sx={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '4px',
            }}>
              <Box id="logo" sx={{
                width: !shrink ? '47px' : '43px',
                height: !shrink ? '47px' : '43px',
                backgroundSize: 'contain !important',
                backgroundRepeat: 'no-repeat !important',
                background: `url(${!shrink ? MySoMeIDLogo1 : MySoMeIDLogo2})`,
              }} />
              <Box id="title" sx={{
                background: `url(${!shrink ? TitleWhitePng : TitleBlackPng})`,
                marginTop: !shrink ? '10px' : '0px',
                marginLeft: 1,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                width: '155px',
                height: '46px',
              }} />

              <Box id="powered-by-concordium" sx={{
                background: `url(${!shrink ? PoweredByWhitePng : PoweredByBlackPng})`,
                marginTop: !shrink ? '-9px' : '9px',
                marginLeft: 1,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                width: '140px',
                height: '30px',
              }} />
            </Box>
          </Link>

          {isInstalled !== null && isInstalled && isConnected && !lt700 ? <Box sx={{ display: { xs: 'block', md: 'block' } }}>
            <ConnectedStatusBadge />
          </Box> : undefined}
        </Box>
      </Box>
    </Slide>
  );
}
