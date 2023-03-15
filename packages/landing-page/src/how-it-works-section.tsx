import * as React from 'react';
import {
  Typography,
  Box,
  Link,
} from '@mui/material';
import {
  SectionBackground
} from './section-background';
import {
  useConfig
} from './hooks';
import ButtonAppStoreSvg from './images/button-app-store.svg';
import ButtonGooglePlaySvg from './images/button-android.svg';
import ButtonChromeWebStoreSvg from './images/button-chrome-web-store.svg';
import HowItWorksSvg from './images/how-it-works.svg';

export const HowItWorksSection = ({}) => {
  const {
    colors,
    storeUrlAppStore,
    storeUrlGooglePlay,
    storeUrlChromeWebStore, 
  } = useConfig();

  const {
    secondaryBgColor,
    secondaryFontColor,
    secondaryButtonFontColor,
    secondaryButtonBgColor,    
  } = colors;

  return (
  <Box id="how-it-works" component="section" sx={theme => ({
    position: 'relative',
    height: '100%',
    flexGrow: '1',
    display: 'flex',
    overflow: 'hidden',
    backgroundColor: secondaryBgColor,
  })}>
    <Box id="content-wrapper" sx={theme => ({
      maxWidth: '1440px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      margin: '0 auto',
      paddingBottom: '65px',
      boxSizing: 'content-box',
      position: 'relative',
      color: secondaryBgColor,
      fontSize: 'calc((1.1 - 1) * 1.2vw + 1rem)',
      fontFamily: 'itc-avant-garde-gothic-pro',
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: '0.02em',
    })}>
      <SectionBackground bg="light" />

      <Box id="content-wrapper" sx={theme => ({
        maxWidth: '1440px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // paddingTop: '6.6vmax',
        // paddingBottom: '6.6vmax',
        paddingLeft: '4vm',
        paddingRight: '4vm',
        margin: '0 auto',
        boxSizing: 'content-box',
        position: 'relative',
        color: 'white',
        fontSize: 'calc((1.1 - 1) * 1.2vw + 1rem)',
        fontFamily: 'itc-avant-garde-gothic-pro',
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: '0.02em',
      })}>
        <Box id="content" sx={theme => ({
          marginTop: '90px',
          width: '100%',
          [theme.breakpoints.up(768)]: {
            width: '80%',
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: '65px',
        })}>
            <Box id="hdr-and-img-container" sx={{
              display: 'grid',
              flexDirection: 'column',
              maxWidth: '1040px',
              boxSizing: 'content-box',
              position: 'relative',
              gridTemplateColumns: '1fr 1fr',
            }}>
              {/* left side */}
              <Box id="header-container" component="div" sx={{
                zIndex: '999',
                boxSizing: 'border-box',
                margin: '0px',
                padding: '0px',
              }}>

                <Typography component='h1' sx={theme => ({
                  fontFamily: 'DIN Alternate Bold',
                  color: '#4D4D4D',
                  letterSpacing: '4px',
                  width: 'maxContent',
                  maxWidth: '100%',
                  marginBottom: '0px',
                  padding: '0px 0px 16px',
                  paddingBottom: '6px',
                  fontSize: '48px',
                  lineHeight: '72px',
                  marginLeft: '-4px', // offset by a small amount to look better.
                  [theme.breakpoints.up(0)]: {
                  },
                  [theme.breakpoints.up(640)]: {
                  },
                  [theme.breakpoints.up(760)]: {
                  },
                  [theme.breakpoints.up(960)]: {
                  },
                  [theme.breakpoints.up(1280)]: {
                  },
                })}>
                  HOW IT WORKS
                </Typography>
                <Typography component="p" sx={ theme => ({
                  maxWidth: '800px',
                  fontSize: '26px',
                  letterSpacing: '2px',
                  lineHeight: '34px',
                  fontWeight: '500',
                  // paddingBottom: '3.6rem',
                  color: '#4D4D4D',
                  [theme.breakpoints.up(0)]: {
                  },
                  [theme.breakpoints.up(640)]: {
                  },
                  [theme.breakpoints.up(760)]: {
                  },
                  [theme.breakpoints.up(960)]: {
                  },
                  [theme.breakpoints.up(1280)]: {
                  },
                })}>
                  Install your Mobile App or Chrome Extension.<br/><br/>
                  Verify your social media accounts.<br/><br/>
                  Use the applications to see if the people you interact with online are who they claim they are.<br/><br/>
                </Typography>

                <Box sx={{marginTop: '0px', display: 'flex', flexDirection: 'row'}}>
                  <Link id="link-appstore" sx={{
                    cursor: 'pointer',
                    ":hover": {
                      textDecoration: 'none'
                    },
                  }} href={storeUrlAppStore} target="_blank">
                    <Box id="link-image" sx={{
                      background: `url(${ButtonAppStoreSvg})`,
                      width: '130px',
                      height: '42px',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover',
                    }} />
                  </Link>
                  <Link id="link-googleplay" sx={{
                    cursor: 'pointer',
                    ":hover": {
                      textDecoration: 'none'
                    },
                  }} href={storeUrlGooglePlay} target="_blank">
                    <Box id="link-image" sx={{
                      background: `url(${ButtonGooglePlaySvg})`,
                      width: '146px',
                      height: '42px',
                      marginLeft: 2,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover',
                    }} />
                  </Link>
                  <Link id="link-chrome-web-store" sx={{
                    cursor: 'pointer',
                    ":hover": {
                      textDecoration: 'none'
                    },
                  }} href={storeUrlChromeWebStore} target="_blank">
                    <Box id="link-image" sx={{
                      background: `url(${ButtonChromeWebStoreSvg})`,
                      width: '142px',
                      height: '42px',
                      marginLeft: 2,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover',
                    }} />
                  </Link>
                </Box>
            </Box>

            {/* right side */}
            <Box id="right-side-container" sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Box id="logo-works" sx={{
                  background: `url(${HowItWorksSvg})`,
                  width: "363px",
                  height: "312px",
                  marginLeft: 2,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                }} />
              </Box>
            </Box> {/* grid box */}

        </Box>
      </Box>
     


    </Box>

  </Box>);
}
