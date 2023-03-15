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

import MySoMeIDLogo1 from 'src/images/logo-white.svg';
import MySoMeIDLogo2 from 'src/images/logo-grey.svg';
import { Link } from 'react-router-dom';

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
      backgroundColor: '#bababa !important',
      color: 'white !important',
      "&:hover": {
        background: '#8a8a8a !important',
        color: 'white',
      },
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
  // fontFamily: "Inter, Arial", 
  fontWeight: "500", 
  lineHeight: "1.5rem", 
  // fontSize: "0.875rem", 
  fontSize: "18px", 
  padding: "6px 12px", 
  color: "white", 
  backgroundColor: "rgb(252, 252, 252, 0.09)",
  paddingLeft: '22px',
  paddingRight: '22px',
  paddingTop: '8px',
  paddingBottom: '8px',
  "&:hover": {
    backgroundColor: 'rgb(252, 252, 252, 0.2)',
    color: 'white',
  },
}) );

export function AppHeader({isConnected, onToggleConnect}: {isConnected: boolean, onToggleConnect: () => void}) {
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
                transform: 'scaleX(1.07)',
              }} />
              <Typography sx={{
                color: !shrink ? 'white' : '#4D4D4D',
                letterSpacing: '2.56px',
                lineHeight: '37px',
                fontSize: '24px',
                marginTop: '-8px',
                fontFamily: 'Golos-UI',
                fontWeight: 400,
                marginLeft: 2,
              }}>MYSOMEID</Typography>

            </Box>
          </Link>

          <Box sx={{ display: { xs: 'block', md: 'block' } }}>
            <OpenButton className={shrink ? classes.buttonSmaller : undefined} onClick={() => {
              onToggleConnect();
            }}>
              {isConnected ? 'Connected' : 'Connect'}
            </OpenButton>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
}
