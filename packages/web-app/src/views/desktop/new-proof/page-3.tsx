import React, {useState, useEffect, useCallback} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  connect,
  useDispatch,
} from 'react-redux';

import {
  reduxForm,
} from 'redux-form';

import validate from './validate';

import {
  Typography,
  Box
} from '@mui/material';

import {
  PrimaryButton,
} from 'src/components';

import {
  useCCDContext,
} from 'src/hooks';

import {
  WizardNav
} from './wizard-nav';

import {
  useSearchParams
} from 'src/hooks/use-search-params';

import {
  WizardLoading
} from './wizard-loading';

import concordiumLogoSvg from 'src/images/concordium-logo.svg';

import xSvg from 'src/images/X.svg';

import formName, {selector} from './form-props';

import { TrackBox } from './track-box';
import { parseNameAndCountry } from './page-2';
import { error } from 'src/slices';
import { fuzzyMatchNames } from 'src/utils';

export default connect(state => ({
  ...(selector(state,
    'platform',
    'userData',
    'statementInfo',
    'profileInfo',
    'proof',
    'proofData',
    'challenge'
  ) ?? {}),
}))(reduxForm({
  form: formName,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
})(props => {
  const {
    previousPage,
    nextPage,
    userData,
    platform,
    profileInfo,
    statementInfo,
    proofData,
    proof,
    challenge,
  } = props;

  const [creating, setCreating] = useState(false);

  // const params = useSearchParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {
    isConnected,
    connect,
    createProofSBNFT,
  } = useCCDContext();

  const [creatingProof, setCreatingProof] = useState(false);
  const [proofCreated, setProofCreated] = useState(false);

  useEffect(() => {
    if ( !userData || !platform || !profileInfo || !statementInfo || !proof ) {
      navigate('/create/1?previousFailed');
      return;
    }
  }, [userData, platform, profileInfo, statementInfo, proof]);

  console.log("statementInfo ", statementInfo, ' proof ', proof);

  let state = !platform ?
                  'show-summary' :
                !isConnected ?
                  'show-connect' :
                !proofCreated ?
                  'show-summary' :
                creatingProof ?
                  'create-proof' :
                proofCreated ? 
                  'done' : 
                '';
  if ( creatingProof ) {
    state = 'create-proof';
  }

  let proofFirstName = ""; 
  try {
    proofFirstName = statementInfo?.proof?.value.proofs[0]?.attribute;
  } catch(e) {
    console.error(e);
  }

  let proofSurname = ""; 
  try {
    proofSurname = statementInfo?.proof?.value.proofs[1]?.attribute;
  } catch(e) {
    console.error(e);
  }

  /* let proofCountry = ""; 
  try {
    proofCountry = statementInfo?.proof?.value.proofs[2]?.attribute;
  } catch(e) {
    console.error(e);
  } */

  // console.log("statementInfo ", statementInfo);
  // console.log("profileInfo ", profileInfo );
  // console.log('proof', proof);
  
  let profileImageUrl: string;
  try {
    profileImageUrl = profileInfo?.profileInfo?.profileImage;
  } catch(e) {
    console.error(e);
  }

  let profileBackgroundUrl: string;
  try {
    profileBackgroundUrl = profileInfo?.profileInfo?.backgroundImage;
  } catch(e) {
    console.error(e);
  }

  const {
    profileFirstName,
    profileSurname,
    // country: profileCountry,
  } = parseNameAndCountry(profileInfo?.profileInfo);

  const onlyUrl = profileInfo?.profileInfo?.onlyUrl ?? true;

  const {
    match: nameMatch,
  } = fuzzyMatchNames(profileFirstName, profileSurname, proofFirstName, proofSurname );
  const firstNameMatch = nameMatch;
  const lastNameMatch = nameMatch;
 
  const nextDisabled = state === 'show-connect' || creating || !nameMatch;

  const onNext = useCallback(() => {
    if ( proofCreated ) {
      console.log('proof is already created!');
      return;
    }
    setCreating(true);
    setCreatingProof(true);

    createProofSBNFT({
      firstName: proofFirstName,
      surName: proofSurname,
      userData,
      challenge,
      platform, 
      proof,
      statementInfo,
      profileBackgroundUrl,
      profileImageUrl,
    }).then(({newProof}) => {
      setProofCreated(false);
      setCreatingProof(false);
      setCreating(false);
      props.change('proofData', newProof);
      nextPage();
    }).catch(e => {
      setCreatingProof(false);
      setProofCreated(false);
      setCreating(false);
      dispatch(error(e?.message ?? 'Error storing proof on Concordium'));
    });
  }, [proofFirstName, proofSurname, userData, challenge, platform, proof, statementInfo]);

  const showLoading = creatingProof;

  return (
    <form>

      <TrackBox id="container-box" sx={{display: 'flex', flexDirection: 'column', }}>
        {({width, height}: {width: number, height: number}) => (

          <>
            <Box sx={{ width: '100%', display: 'flex', opacity: showLoading ? 0.1 : 1}}>
              {state === 'show-connect' ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}>
                  <Typography variant="h3" sx={{}}>
                    We are almost there
                  </Typography>
                  <Typography display="block" sx={{marginTop: '8px', textAlign: 'center', lineHeight: '1.3'}}>
                    Please connect your wallet to Concordium to create the proof
                  </Typography>
                  <PrimaryButton sx={{marginTop: '24px'}} variant="understated" onClick={connect} >Connect</PrimaryButton>
                </Box>
              ) : 
              state === 'show-summary' || state === 'create-proof' ? (
                <Box id="summary" sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>

                  <Box sx={{display: 'flex', marginTop: '24px', justifyContent: 'space-evenly'}}>
                    {statementInfo && proof ?
                    <>
                      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
                        <Typography variant="h3" display="block"><strong>Your Profile to Secure</strong></Typography>
                        <Typography variant="h6" display="block">{userData ?? '?'}</Typography>
                        <Box sx={{
                          width: '140px',
                          height: '140px',
                          background: `url(${profileImageUrl})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          borderRadius: '1111px',
                          border: '1px solid',
                          marginTop: '16px'
                        }} />
                        <Box sx={{display: 'flex', flexDirection: 'column', minWidth: '200px', marginTop: '16px'}}>

                          {
                            !onlyUrl ? 
                            <>
                              <Box sx={{display: 'flex'}}>
                                <Typography variant="h6" display="block" marginRight="12px">First name</Typography>
                                <Typography variant="h6" display="block" marginLeft="auto">{profileFirstName} { !onlyUrl ? firstNameMatch ? '✅' : '❌' : undefined}</Typography>
                              </Box>
                              <Box sx={{display: 'flex'}}>
                                <Typography variant="h6" display="block" marginRight="12px">Surname</Typography>
                                <Typography variant="h6" display="block" marginLeft="auto">{profileSurname} { !onlyUrl ? lastNameMatch ? '✅' : '❌' : undefined}</Typography>
                              </Box>
                            </> : 
                            <>
                              <Box sx={{display: 'flex'}}>
                                <Typography variant="h6" display="block" marginRight="12px">Platform</Typography>
                                <Typography variant="h6" display="block" marginLeft="auto">LinkedIn</Typography>
                              </Box>
                              <Box sx={{display: 'flex'}}>
                                <Typography variant="h6" display="block" marginRight="12px">User Id</Typography>
                                <Typography variant="h6" display="block" marginLeft="auto">{userData}</Typography>
                              </Box>
                            </>
                          }
                        </Box>
                      </Box>

                      <Box sx={{
                          width: '115px',
                          height: '115px',
                          background: `url(${xSvg})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'contain',
                          marginTop: 'auto',
                          marginBottom: 'auto',
                        }} />

                      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
                        <Typography variant="h3" display="block"><strong>Your Digital ID</strong></Typography>
                        <Typography variant="h6" display="block">Concordium Identity</Typography>
                        <Box sx={{
                          width: '140px',
                          height: '140px',
                          background: `url(${concordiumLogoSvg})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          borderRadius: '1111px',
                          // border: '1px solid',
                          backgroundPositionX: '3px',
                          backgroundPositionY: '3px',
                          marginTop: '16px'
                        }} />
                        <Box sx={{display: 'flex', flexDirection: 'column', minWidth: '200px', marginTop: '16px'}}>
                          <Box sx={{display: 'flex'}}>
                            <Typography variant="h6" display="block" marginRight="12px">First name</Typography>
                            <Typography variant="h6" display="block" marginLeft="auto">{proofFirstName}</Typography>
                          </Box>
                          <Box sx={{display: 'flex'}}>
                            <Typography variant="h6" display="block" marginRight="12px">Surname</Typography>
                            <Typography variant="h6" display="block" marginLeft="auto">{proofSurname}</Typography>
                          </Box>
                          {/*<Box sx={{display: 'flex'}}>
                            <Typography variant="h6" display="block" marginRight="12px">Country</Typography>
                            <Typography variant="h6" display="block" marginLeft="auto">{proofCountry} ✅</Typography>
                          </Box>*/}
                        </Box>
                      </Box>
                    </>
                    : undefined}
                  </Box>
                </Box>
              ) : state === 'done' ? (
                null
              ) :
                undefined 
              }
            </Box>

            {
              showLoading ?
                <Box sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                  <WizardLoading title="Creating Proof" subtitle="Accept transaction to create proof" />
                </Box>
                :
                undefined
            }
          </>
        )}
      </TrackBox>

      <WizardNav {...{
        sx: {marginTop: '32px',},
        prev: "Back",
        next: 'Create Proof',
        nextDisabled,
        onPrev: previousPage,
        onNext,
      }} />
    </form>
  );
}));
