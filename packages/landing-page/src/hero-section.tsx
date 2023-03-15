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
} from './hooks/use-config';

import Tilt from 'react-parallax-tilt';

import HeroShield from "./images/hero-shield.svg";

import HeroHex from './images/hero-hex-bg.svg';

const part2Vis = true;
const marginSocial = {
  marginLeft: '8px',
  marginRight: '8px'
};

const socialFill = (primaryButtonFontColor: string) => ({fill: primaryButtonFontColor});
const linkBtn = (primaryButtonFontColor: string, primaryButtonBgColor: string) => ({
  borderRadius: '300px',
  color: primaryButtonFontColor,
  backgroundColor: primaryButtonBgColor,
  borderColor: primaryButtonBgColor,
  padding: '16px 26px 16px 26px',
  textDecoration: 'none',

  fontSize: 'calc((1.1 - 1) * 1.2vw + 1rem)',
  // lineHeight: '1em',
  fontFamily: 'itc-avant-garde-gothic-pro',
  fontWeight: 600,
  fontStyle: 'normal',
  textTransform: 'none',
  lineHeight: '1.2em',
  letterSpacing: '.05em',
});

export const HeroSection = ({}) => {
  const config = useConfig();
  const {
    appUrl,
  } = config;
  const {
    primaryFontColor,
  } = config.colors;

  return (
  <Box id="hero" component="section" sx={theme => ({
    position: 'relative',
    height: '100%',
    flexGrow: '1',
    display: 'flex',
    overflow: 'hidden',
    /*[theme.breakpoints.up(0)]: {
      paddingTop: '0px',
      paddingBottom: '40px',
      marginBottom: '40px',
    },
    [theme.breakpoints.up(960)]: {
      paddingBottom: '48px',
    },
    [theme.breakpoints.up(1280)]: {
      paddingBottom: '78px',
      marginBottom: '48px',
    },*/
  })}>
    <SectionBackground />

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
      color: primaryFontColor,
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
        <Box>
          <Box id="hdr-and-img-container" sx={{
            display: 'grid',
            flexDirection: 'column',
            maxWidth: '1040px',
            boxSizing: 'content-box',
            position: 'relative',
            gridTemplateColumns: '1fr 1fr',
          }}>
            <Box id="header-container" component="div" sx={{
              zIndex: '999',
              boxSizing: 'border-box',
              margin: '0px',
              padding: '0px',
              paddingTop: '100px',
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
                fontSize: '65px',
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
                OWN YOUR ID
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
                Secure your social media identity with a self-issued badge of authenticity!
              </Typography>
              <Box sx={{marginTop: '39px'}}>
                <Link sx={{
                  fontFamily: 'DIN Alternate Bold',
                  fontWeight: 500,
                  letterSpacing: '1.76px',
                  lineHeight: '34px',
                  background: '#0682CA',
                  color: 'white',
                  borderRadius: '625rem',
                  padding: '14px 24px 14px 24px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  ":hover": {
                    textDecoration: 'none'
                  },
                }} href={appUrl}>
                  GET STARTED
                </Link>
              </Box>
            </Box>

            <Box>
              <Box id="hex-bg" sx={{
                width: "523px",
                height: "473px",
                background: `url(${HeroHex})`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: '32px'
              }}>
                {/* https://www.npmjs.com/package/react-parallax-tilt */}
                <Tilt {...{
                  glareEnable: true,
                  scale: 1.06,
                  glareMaxOpacity: 0.4,
                  glarePosition: 'all',
                  glareColor: '#ffffff',
                  glareBorderRadius: '0',
                }}>
                  <Box id="shield" sx={{
                    width: "326px",
                    height: "369px",
                    background: `url(${HeroShield})`,
                  }}>
                  </Box>
                </Tilt>
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>

  </Box>);
}
