import {
  useCallback,
} from 'react';

import {
  Typography,
  Box,
  Skeleton,
} from '@mui/material';

import logoSvg from 'src/images/logo-white.svg';
import QRCode from 'react-qr-code';
import { TrackBox } from './track-box';
import { defaultProofColor } from 'src/themes/theme';

let template: HTMLElement | null = null;

function s_styles(style: string) {
  template = template ?? document.createElement('___template');
  template.setAttribute('style', style)
  return Object.entries(template.style)
      .filter(([ key ]) => !/^[0-9]+$/.test(key))
      .filter(([ , value ]) => Boolean(value))
      .reduce((acc, [ key, value ]) => ({ ...acc, [key]: value }), {});
}

type CertificateArgs = {
  loading?: boolean;
  sx?: any;
  hideBorder?: boolean;
  hideQR?: boolean;
  subHeader?: string;
  header?: string;
  profilePageUrl: string;
  profileImageUrl: string;
  uri: string;
  userData: string;
  profileFirstName: string;
  profileSurname: string;
  mobileVersion?: boolean;
  issueDate?: string;
  urlMatch?: string;
  activeValid?: string;
  showConnectWithLinkedIn?: boolean;
};

export const Certificate = ({
  mobileVersion: isMob,
  hideBorder,
  hideQR,
  header,
  loading,
  subHeader,
  sx,
  profilePageUrl,
  profileImageUrl,
  uri,
  userData,
  profileFirstName,
  profileSurname,
  issueDate,
  urlMatch,
  activeValid,
  showConnectWithLinkedIn,
}: CertificateArgs) => {
  // const certBorderC = !showConnectWithLinkedIn ? '#717171' : 'rgba(113, 113, 113, 0.05)';
  const certBorderC = '#717171';
  const notMob = !isMob;
  header = header ?? 'PROOF';
  subHeader = subHeader ?? 'Of Account Ownership';
  const notMobVal = useCallback((normVal: any, mobVal?: any) => (isMob ? mobVal ?? undefined : normVal), [isMob]);
  const helpSx = showConnectWithLinkedIn ? {opacity: 0.1} : {};
  const tmp = ({width, height}: {width: number, height: number}) => null;
  return (
  <Box id="certificate" sx={{marginTop: notMobVal('24px'), background: "white", display: 'flex', flexDirection: 'column', width: notMobVal('80%', '100%'), ...(sx ?? {})}}>
    <Box width="100%" height="100%">
      <TrackBox id="certificate-client-area" sx={{display: 'flex', margin: notMobVal('24px'), justifyContent: 'space-evenly', border: !hideBorder ? `solid ${certBorderC} 1px` : undefined, paddingBottom: '24px'}}>
        {(({width, height}) => (
        <>
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
            <Typography variant="h3" display="block" sx={{marginTop: notMobVal('-17px', '-14px'), paddingLeft: '20px', paddingRight: '20px', background: 'white', letterSpacing: '3px'}}><strong>{header}</strong></Typography>
            <Typography variant="h6" display="block" sx={{}}>{subHeader}</Typography>
            
            <Box sx={{
              ...helpSx,
              height: '32px',
              width: notMobVal('77%', undefined),
              border: !hideBorder ? `1px solid ${certBorderC}` : undefined,
              margin: notMobVal('24px', '8px'),
              marginTop: notMobVal(undefined, '16px'),
              paddingLeft:  notMobVal(undefined, '16px'),
              paddingRight:  notMobVal(undefined, '16px'),
              display: 'flex',
              alignItems: 'center',
              placeContent: 'center',
            }} >
              {profilePageUrl}
              {loading && !profilePageUrl ?
                <Skeleton animation="wave" variant="text" width={120}/> : undefined}
            </Box>

            <Box id="cert-content" display="flex" width="100%" sx={{
              justifyContent: 'space-evenly',
              alignItems: 'center',
              margin: '24px',
              marginTop: '0',
              flexDirection: notMob ? 'row' : 'column',
            }}>
              <Box id="personal-info" sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
              }}>
                <Box id="avatar" sx={{
                  width: '140px',
                  height: '140px',
                  background: `url(${profileImageUrl})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  borderRadius: '1111px',
                  border: '1px solid',
                  marginTop: '16px',
                  ...helpSx,
                }} >
                  {loading && !profileImageUrl ? <Skeleton animation="wave" variant="circular" width={130} height={130} sx={{marginLeft: '4px', marginTop: '4px'}} /> : undefined}
                </Box>

                <Box sx={{...helpSx,display: 'flex', flexDirection: 'column', minWidth: '200px', marginTop: '16px'}}>
                  <Box sx={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                    <Typography variant="h6" display="block">{userData}</Typography>
                    {loading && !userData ?
                        <Skeleton animation="wave" variant="text" width={120}/> : undefined}
                  </Box>
                  <Box sx={{display: 'flex', marginTop: '16px'}}>
                    
                    <Typography variant="h6" display="block" marginRight="12px">First name</Typography>
                    <Typography variant="h6" display="block" marginLeft="auto">
                      {profileFirstName}
                      {loading && !profileFirstName ?
                        <Skeleton animation="wave" variant="text" width={90}/> : undefined}
                    </Typography>
                  </Box>
                  <Box sx={{display: 'flex'}}>
                    <Typography variant="h6" display="block" marginRight="12px">Surname</Typography>
                    <Typography variant="h6" display="block" marginLeft="auto">
                      {profileSurname}
                      {loading && !profileFirstName ?
                        <Skeleton animation="wave" variant="text" width={90}/> : undefined}
                    </Typography>
                  </Box>
                  {issueDate !== undefined ? <Box sx={{display: 'flex'}}>
                    <Typography variant="h6" display="block" marginRight="12px">Issue date</Typography>
                    <Typography variant="h6" display="block" marginLeft="auto">
                      {issueDate ?? ''}
                      {loading && !issueDate ?
                        <Skeleton animation="wave" variant="text" width={90}/> : undefined}
                    </Typography>
                  </Box> : undefined}
                  {activeValid !== undefined ? <Box sx={{display: 'flex'}}>
                    <Typography variant="h6" display="block" marginRight="12px">Active/valid</Typography>
                    <Typography variant="h6" display="block" marginLeft="auto">
                      {activeValid ?? ''}
                      {loading && !activeValid ?
                        <Skeleton animation="wave" variant="text" width={90}/> : undefined}
                    </Typography>
                  </Box> : undefined}
                </Box>
              </Box>

              {!isMob && !hideQR ? <Box id="line" sx={{...helpSx, width: '1px', background: `${certBorderC}`, minHeight: '30px', height: 'calc(100% - 50px)', margin: '25px'}} /> : undefined}
              {isMob && !hideQR ? <Box id="line" sx={{...helpSx, width: '75%', height: '1px', background: `${certBorderC}`, margin: '42px'}} /> : undefined}

              {!hideQR ? <Box id="proof-widget"
                sx={{
                  width: '200px',
                  minWidth: '200px',
                  minHeight: '260px',
                  background: defaultProofColor,
                  borderRadius: '8px',
                  padding: '8px',
              }}>
                <Box sx={{background: 'white', width:`${200-16}px`, height: `${200-16}px`}}>
                  {uri ?
                    <QRCode
                      id="qr-code-canvas"
                      value={uri}
                      size={200-16}
                      viewBox={`0 0 256 256`}
                      style={{
                        height: `${200-16}px`,
                        width: `${200-16}px`,
                        padding: `${Math.round(6)}px`,
                        background: 'white',
                      }}
                    /> :
                    loading ? <Skeleton animation="wave" variant="rectangular" width={200-16} height={200-16}/> : undefined
                  }
                </Box>
                <Box display="flex" sx={{marginTop: '8px', placeItems: "center", justifyContent: "center"}}>
                  <Box sx={{
                    background: `url(${logoSvg})`,
                    width: "51px",
                    height: "44px",
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                    marginRight: '8px',
                  }}/>
                  <Typography sx={{fontSize: '16px', textAlign: 'center', color: 'white'}}>VERIFIED BY<br/>MYSOMEID</Typography>
                </Box>
              </Box>: undefined}
            </Box> 
          </Box> 
          <Box id="explanation-content" sx={{
            display: showConnectWithLinkedIn ? "flex" : 'none',
            position: 'absolute',
            justifyContent: !isMob ? 'left' : 'center',
            marginLeft: !isMob ? '56px' : undefined,
            alignItems: !isMob ? 'center' : 'flex-start',
            width: `${width}px`,
            height: `${height}px`,
          }}>
            <Box id="left" sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              maxWidth: '50%',
              marginTop: !isMob ? '88px' : '56px',
            }}>
              <Box sx={{textAlign: 'center', padding: '24px', background: 'rgb(224 224 224 / 60%)', borderRadius: '30px'}}>
                <Typography sx={{maxWidth: '100%', fontSize: '16px'}}>
                  Finalize the verification of your profile by connecting your Proof to LinkedIn.
                  <br/><br/>
                  This step is necessary to allow others to see that your profile is verified. They can do this by either scanning the proof with their mobile phone or using the MYSOME extension.
                  <br/><br/>
                  {'To do this you need to download the background picture and upload it to your LinkedIn profile.'}
                </Typography>
              </Box>
            </Box>

          </Box>
      </>))}
      </TrackBox>
    </Box>
  </Box>    
  );  
}
