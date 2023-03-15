import * as React from 'react';

import {
  Typography,
  Box,
  Link,
} from '@mui/material';

import ConnectivityImage from './images/connectivity.svg';

const part2Vis = true;
const marginSocial = {
  marginLeft: '8px',
  marginRight: '8px'
};

const linkBtn = (secondaryButtonBgColor: string, secondaryButtonFontColor: string) => ({
  borderRadius: '300px',
  color: secondaryButtonFontColor,
  backgroundColor: secondaryButtonBgColor,
  borderColor: secondaryButtonBgColor,
  padding: '16px 26px 16px 26px',
  textDecoration: 'none',
  fontSize: 'calc((1.1 - 1) * 1.2vw + 1rem)',
  fontFamily: 'itc-avant-garde-gothic-pro',
  fontWeight: 500,
  fontStyle: 'normal',
  textTransform: 'none',
  lineHeight: '1.2em',
  letterSpacing: '.05em',
});

import {
  useConfig
} from './hooks';
import { SectionBackground } from './section-background';

export const YourKeysSection = ({}) => {
  const {
    colors,
    appUrl,
  } = useConfig();

  const {
    secondaryBgColor,
  } = colors;

  return (
  <Box id="your-keys" component="section" sx={theme => ({
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
      <SectionBackground bg="dark" />

      <Box id="content-wrapper" sx={theme => ({
        maxWidth: '1440px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
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
            <Box id="image-container">
              <Box id="connectivity-image" sx={{
                background: `url(${ConnectivityImage})`,
                width: "500px",
                height: "236px",
                padding: '0',
                margin: '0',
                marginTop: '40px',
              }}>
                
              </Box>
            </Box>

            {/* left side */}
            <Box id="text-container" component="div" sx={{
              zIndex: '999',
              boxSizing: 'border-box',
              margin: '0px',
              padding: '0px',
              paddingLeft: '75px',
            }}>

              <Typography component='h1' sx={theme => ({
                fontFamily: 'DIN Alternate Bold',
                color: 'white',
                letterSpacing: '4px',
                width: 'maxContent',
                maxWidth: '100%',
                marginBottom: '0px',
                padding: '0px 0px 16px',
                paddingBottom: '6px',
                fontSize: '42px',
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
                Your keys, Your ID.
              </Typography>
              <Typography component="p" sx={ theme => ({
                maxWidth: '800px',
                fontSize: '26px',
                letterSpacing: '2px',
                lineHeight: '34px',
                fontWeight: '500',
                // paddingBottom: '3.6rem',
                color: 'white',
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
                Your social media ID is issued by yourself and connected to your verified blockchain wallet on the Concordium Blockchain.
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
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>);
}
