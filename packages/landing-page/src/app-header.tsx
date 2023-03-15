import {
  Slide,
  useMediaQuery,
  useScrollTrigger,
  useTheme,
  // Button,
  Typography
} from '@mui/material';

import {
  Theme,
} from '@mui/material/styles';

import {
  makeStyles,
} from '@mui/styles';

import {
  styled,
} from '@mui/system';

import Box from '@mui/material/Box';
import * as React from 'react';
import {
  useState,
  useEffect
} from 'react';

import {
  useConfig
} from './hooks/use-config';

import MySoMeIDLogo from './images/mysomeid-logo.svg';

const len = '0.2s';
const curve = 'cubic-bezier(0, 0, 0.2, 1)';
const transitionProps = `background-color ${len} ${curve},
                         height ${len} ${curve},
                         padding ${len} ${curve}
                         `;

const useStyles = makeStyles((theme: Theme) => {
  const headerHeight = 60;
  const headerHeightLarge = 154;
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
      padding: '34px 50px',
      backgroundColor: "transparent",
      transition: transitionProps,
      height: `${headerHeightLarge}px`,
    },
    smaller: {
      padding: '8px 8px 8px 20px',
      height: `${headerHeight}px`,
      backgroundColor: '#f9f9f9',
      transition: transitionProps,
      boxShadow: '0px 4px 10px rgb(53 53 53 / 16%)',
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
      backgroundColor: 'black !important',
      color: 'white !important',
    },
  })
});

const OpenButton = styled('a', {
  shouldForwardProp: (prop) => prop !== 'color' && prop !== 'variant' && prop !== 'sx',
})( ({theme}) => ({
  p: '6px 8px',
  display: "inline-flex", 
  alignItems: "center", 
  justifyContent: "center", 
  position: "relative", 
  boxSizing: "border-box", 
  outline: "0px", 
  border: "0px", 
  margin: "0px", 
  cursor: "pointer", 
  userSelect: "none", 
  verticalAlign: "middle", 
  appearance: "none", 
  textDecoration: "none", 
  minWidth: "64px", 
  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", 
  boxShadow: "none", 
  borderRadius: "625rem", 
  fontFamily: "Inter, Arial", 
  fontWeight: "500", 
  lineHeight: "1.5rem", 
  // fontSize: "0.875rem", 
  fontSize: "18px", 
  padding: "6px 12px", 
  color: "rgb(15, 18, 29)", 
  backgroundColor: "rgb(234, 235, 239)",
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingTop: '8px',
  paddingBottom: '8px',
}) );

interface Props {
  children: React.ReactElement;
}

export default function AppHeader({}) {
  const theme = useTheme();

  const md = useMediaQuery(theme.breakpoints.down('md'));
  const classes = useStyles();
  const [scrollTarget, setScrollTarget] = useState(undefined)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletWidgetOpen, setWalletWidgetOpen] = useState(false);

  const shrink = useScrollTrigger({
    target: undefined,
    disableHysteresis: true,
    threshold: 30,
  });

  const hide = useScrollTrigger({threshold: 200});

  const {
    appUrl,
  } = useConfig();

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
          <Box id="logo-container" className={[classes.logo, shrink ? classes.logoSmaller : classes.logoLarger].join(' ')} sx={{
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box id="logo" sx={{
              width: shrink ? '55px' : '75px',
              height: shrink ? '43px' : '63px',
              backgroundSize: 'contain !important',
              backgroundRepeat: 'no-repeat !important',
              background: `url(${MySoMeIDLogo})`,
            }} />
            <Typography sx={{
              color: '#4D4D4D',
              letterSpacing: '2.56px',
              lineHeight: '37px',
              fontSize: '32px',
              fontFamily: 'DIN Alternate Bold',
              fontWeight: 500,
              marginLeft: 2,
            }}>MYSOMEID</Typography>

          </Box>

          <Box sx={{ display: { xs: 'block', md: 'block' } }}>
            <OpenButton className={shrink ? classes.buttonSmaller : undefined} target="_self" href={appUrl}>
              Launch App
            </OpenButton>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
}
