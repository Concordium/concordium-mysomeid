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
import FraudPreventionImage from './images/no-fraudsters.svg';

export const PreventFraudSection = ({}) => {
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
            <Box id="image-container" sx={{
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Box id="fraud-prevention-image" sx={{
                background: `url(${FraudPreventionImage})`,
                width: "264px",
                height: "297px",
                padding: '0',
                margin: '0',
                marginTop: '40px',
                backgroundRepeat: 'no-repeat',
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
                Prevent Fraud
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
                Avoid loss of reputation or capital by using the MYSOME ID Chrome Extension or Mobile App to check if the person contracting you are verified or not.
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
};
