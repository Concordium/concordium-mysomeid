import {
  useCallback, useState,
} from 'react';
import {
  Typography,
  Box,
  Skeleton,
  InputBase,
  Input
} from '@mui/material';
import logoSvg from 'src/images/logo-white.svg';
import QRCode from 'react-qr-code';
import { TrackBox } from 'src/views/desktop/new-proof/track-box';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import { AspectBox } from "src/views/desktop/new-proof/aspect-box";
import verifyXSvg from 'src/images/verify-x.svg';
import verifyIDSvg from 'src/images/verify-id.svg';
import {
  Button
} from 'src/components';
import { VerifyProofResult, useAPI } from 'src/hooks/use-api';
import { errorText, successText } from 'src/themes/theme';
// import { TrackBox } from 'src/views/desktop/new-proof/track-box';

type CertificateArgs = {
  uri: string;
  userData: string;
  profileFirstName: string;
  profileSurname: string;
  decryptionKey: string;
  id: string;
};

export const MobileCertificate = ({
  uri,
  userData,
  profileFirstName,
  profileSurname,
  decryptionKey,
  id,
}: CertificateArgs) => {
  const { verifyProof } = useAPI();
  const [showProofResult, setShowProofResult] = useState(false);
  const [verifyingProofStatus, setVerifyingProofResult] = useState<null | VerifyProofResult>(null);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [value, setValue] = useState('');
  const background = 'linear-gradient(130deg, rgba(23,87,222,1) 0%, rgba(31,164,254,1) 31%, rgba(43,173,255,1) 70%, rgba(119,208,255,1) 100%)';
  const boxShadow = '0px -2px 60px -1px rgba(0,0,0,0.43)';
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);
  const verifyEnabled = !!value && value.length > 0;
  const onVerify = useCallback(() => {
    if (!verifyEnabled) {
      return;
    }
    if (verifyingProof ) {
      return;
    }

    // if user adds the whole linked in url by copy paste.
    let userDataToVerify = value;
    if ( value && value.match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)) ) {
      const lowerCaseValue = userDataToVerify.toLowerCase();
      if ( lowerCaseValue.indexOf('linkedin.com/in/') >= 0 ) {
        const components = lowerCaseValue.split('linkedin.com/in/');
        if ( components[1] ) {
          const newValue = components[1].split('/')[0];
          if ( newValue?.[0] ) {
            setValue(newValue);
            userDataToVerify = newValue;
          }
        }
      }
    }

    setVerifyingProof(true);
    verifyProof({ id, decryptionKey, userData: userDataToVerify }).then((result: VerifyProofResult) => {
      setVerifyingProofResult( result );
    }).catch(e => {
      setVerifyingProofResult('no-connection');
    }).finally(() => {
      setVerifyingProof(false);
      setShowProofResult(true);
    });

  }, [verifyEnabled, verifyingProof, value]);
  const onBack = useCallback(() => {
    setShowProofResult(false);
  }, []);

  const showMessage = (
    verifyingProofStatus === 'no-connection' ?
      'NO CONNECTION' :
    verifyingProofStatus === 'valid' ?
      'THIS PROOF IS VALID' :
    (verifyingProofStatus === 'invalid' || verifyingProofStatus === 'user-data-not-matching') ?
      'THIS PROOF IS INVALID' :
    verifyingProofStatus === 'revoked' ?
      'THIS PROOF IS REVOKED' :
    undefined
  );

  return (
    <Box display="flex" flexDirection="column" sx={{ color: 'white', background, boxShadow, borderRadius: '32px', textAlign: 'center', margin: '32px', marginTop: '56px', padding: '16px' }} >
      <Typography component="h3" display="block" sx={{ marginTop: '8px', display: 'flex', alignSelf: 'center', fontSize: '16px', fontWeight: 400, lineHeight: '1.3', float: 'left' }}>
        LinkedIn <LinkedInIcon sx={{ width: '21px', height: '21px' }} />
      </Typography>

      <Typography component="h3" display="block" sx={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, lineHeight: '1.3', float: 'left' }}>
        {profileFirstName} {profileSurname}
      </Typography>

      <TrackBox id="certificate-client-area" sx={{ display: 'flex', margin: '24px 16px 0px 16px', justifyContent: 'space-evenly' }}>
        {(({ width, height }) => (
          <QRCode
            id="qr-code-canvas"
            value={uri}
            size={200 - 16}
            viewBox={`0 0 256 256`}
            style={{
              height: `${200 - 16}px`,
              width: `${200 - 16}px`,
              padding: `${Math.round(6)}px`,
              background: 'white',
            }}
          />
        ))}
      </TrackBox>

      {!showProofResult ? <Typography display="block" sx={{ fontSize: '14px', margin: '24px 16px 0px 16px', fontWeight: 400, lineHeight: '1.3', float: 'left' }}>
        To see if the profile is linked to a valid proof, please input the user-id below.
      </Typography> : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', padding: '0px 16px 16px 16px' }}>
        {!showProofResult ?
          <>
            <InputBase {...{
              disabled: false,
              placeholder: "User-id",
              autoComplete: "off" ,
              spellCheck: "false",
              autoCorrect: "off",
              sx: {
                marginTop: '24px',
                color: '#1D1D1D',
                lineHeight: '1.4375em',
                boxSizing: 'border-box',
                position: 'relative',
                cursor: 'text',
                display: 'inline-flex',
                alignItems: 'center',
                flex: '1 1 0%',
                borderRadius: '8px',
                background: 'white',
                fontSize: '14px',
                padding: '16px',
                textAlign: 'center !important',
                '&.MuiInputBase-root': {
                  padding: '0',
                },
                ">.MuiInputBase-input": {
                  padding: '11px !important',
                  textAlign: 'center !important',
                },
              },
              onChange,
              value,
            }} />
            <Button onClick={onVerify} variant="primary" sx={{
              background: !verifyEnabled ? 'rgb(200, 193, 183) !important' : undefined,
              marginTop: '16px',
              fontSize: '14px !important',
            }}>
              Verify Profile
            </Button>
          </>
          : // Else show verification result;
          <> 
            <Box alignSelf="center">
              <Box sx={{ display: 'flex', marginTop: '16px', alignItems: 'center'}}>
                <Box component="img" src={verifyIDSvg} sx={{ width: '26px', height: '26px', marginRight: '8px' }} />
                <Typography component="h3" display="block" sx={{ marginTop: '0px', fontSize: '16px', fontWeight: 600, lineHeight: '1.3', float: 'left' }}>
                  {userData}
                </Typography>
              </Box>
              {
                ['valid', 'revoked', 'no-connection'].indexOf(verifyingProofStatus) === -1 ?
                  <>
                    <Box sx={{display: 'flex', alignItems: 'center', marginTop: '8px',}}>
                      <Box component="img" src={verifyXSvg} sx={{ width: '26px', height: '26px', marginRight: '8px' }} />
                      <Typography key={'text-error'} component="h3" display="block" sx={{ color: 'rgb(242, 71, 38) !important', marginTop: '0px', fontSize: '16px', fontWeight: 600, lineHeight: '1.3', float: 'left' }}>
                        {value ? value : '<blank>'}
                      </Typography>
                    </Box>
                  </> : null
              }
              

              {showMessage ?
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center',  marginTop: '8px', background: verifyingProofStatus === 'valid' ? successText : errorText, minHeight: '62px', borderRadius: '8px', padding: '16px',}}>
                  <Typography component="h3" display="block" sx={{ color: 'white', marginTop: '0px', fontSize: '16px', fontWeight: 600, lineHeight: '1.3', float: 'left' }}>
                    {showMessage}
                  </Typography>
                </Box>
              : undefined}
            </Box>
            <Button onClick={onBack} variant="primary" sx={{
              marginTop: '16px',
              fontSize: '14px !important',
            }}>
              Back
            </Button>
          </>
        }
      </Box>

    </Box>
  );
};
