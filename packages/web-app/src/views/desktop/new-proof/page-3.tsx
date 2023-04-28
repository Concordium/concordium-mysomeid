import React, { useState, useEffect, useCallback } from 'react';

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
  Box,
  useTheme,
  useMediaQuery
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

import MeltSvg from 'src/images/melt.svg';

import {
  WizardLoading
} from './wizard-loading';

import LinkedInIcon from '@mui/icons-material/LinkedIn';

import concordiumLogoSvg from 'src/images/concordium-white-logo.svg';

import formName, { selector } from './form-props';

import { TrackBox } from './track-box';
import { parseNameAndCountry } from './page-2';
import { error } from 'src/slices';
import { fuzzyMatchNames } from 'src/utils';
import { InstallExtensions } from './install-extensions';
import { minLayoutBoxHeight } from './form-consts';

type PlatformProfileRepresentationArgs = {
  userData: string;
  profileImageUrl: string;
  platform: 'li',
  firstName: string;
  surname: string;
  firstNameMatch?: boolean;
  surnameMatch?: boolean;
};

export const PlatformProfileRepresentation = ({
  userData, 
  profileImageUrl,
  platform,
  firstName,
  surname,
  firstNameMatch: firstNameMatch = null,
  surnameMatch: surnameMatch = null
}: PlatformProfileRepresentationArgs) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '287px', }}>
      {platform === 'li' ? <Typography display="flex" variant="h6" fontSize="16px" fontWeight="400">LinkedIn<LinkedInIcon sx={{ marginTop: '2px', width: '21px', height: '21px' }} /></Typography>: undefined }
      <Typography variant="h6" display="block">{userData ?? '?'}</Typography>
      <Box sx={{
        width: '140px',
        height: '140px',
        background: `url(${profileImageUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        borderRadius: '1111px',
        border: '1px solid',
        marginTop: '24px'
      }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: '32px', width: '100%', paddingLeft: '32px', paddingRight: '32px' }}>
        <Box sx={{ display: 'flex' }}>
          <Typography variant="h6" display="block" marginRight="12px" fontWeight="400">First name</Typography>
          <Typography variant="h6" display="block" marginLeft="auto">{firstName} {firstNameMatch !== null ? firstNameMatch ? '✅' : '❌' : undefined}</Typography>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Typography variant="h6" display="block" marginRight="12px" fontWeight="400">Surname</Typography>
          <Typography variant="h6" display="block" marginLeft="auto">{surname} {surnameMatch !== null ? surnameMatch ? '✅' : '❌' : undefined}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

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
  const [proofCreated, setProofCreated] = useState(!!proofData);

  useEffect(() => {
    if (!userData || !platform || !profileInfo || !statementInfo || !proof) {
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
  if (creatingProof) {
    state = 'create-proof';
  }

  let proofFirstName = "";
  try {
    proofFirstName = statementInfo?.proof?.value.proofs[0]?.attribute;
  } catch (e) {
    console.error(e);
  }

  let proofSurname = "";
  try {
    proofSurname = statementInfo?.proof?.value.proofs[1]?.attribute;
  } catch (e) {
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
  } catch (e) {
    console.error(e);
  }

  let profileBackgroundUrl: string;
  try {
    profileBackgroundUrl = profileInfo?.profileInfo?.backgroundImage;
  } catch (e) {
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
  } = fuzzyMatchNames(profileFirstName, profileSurname, proofFirstName, proofSurname);
  const firstNameMatch = nameMatch;
  const lastNameMatch = nameMatch;

  const theme = useTheme();

  const lt620 = useMediaQuery(theme.breakpoints.down(620));
  const lt800 = useMediaQuery(theme.breakpoints.down(800));
  const lt900 = useMediaQuery(theme.breakpoints.down(900));

  const nextDisabled = state === 'show-connect' || creating || !nameMatch;

  const onNext = useCallback(() => {
    if (proofCreated) {
      console.log('Proof is already created!');
      nextPage();
      return;
    }

    // Ensure we are connected.
    if (!isConnected) {
      connect();
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
    }).then(({ newProof }) => {
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
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
          {({ width, height }: { width: number, height: number }) => (
            <Box id="layout-column" sx={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: minLayoutBoxHeight }}>

              <Box sx={{ width: '100%', display: 'flex', opacity: showLoading ? 0.1 : 1 }}>
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
                    <Typography display="block" sx={{ marginTop: '8px', textAlign: 'center', lineHeight: '1.3' }}>
                      Please connect your wallet to Concordium to create the proof
                    </Typography>
                    <PrimaryButton sx={{ marginTop: '24px' }} variant="understated" onClick={connect} >Connect</PrimaryButton>
                  </Box>
                ) :
                  state === 'show-summary' || state === 'create-proof' ? (
                    <Box id="summary" sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

                      <Box sx={{ display: 'flex', marginTop: '24px', justifyContent: 'space-evenly' }}>
                        {statementInfo && proof ?
                          <Box sx={{
                            background: `url(${MeltSvg})`,
                            width: '728px',
                            height: '402px',
                            display: 'flex',
                            paddingTop: '24px',
                            transform: lt900 ? `scale(${window.innerWidth / 900})` : undefined,
                          }}>
                            <PlatformProfileRepresentation {...{
                              userData,
                              platform,
                              profileImageUrl,
                              firstName: profileFirstName,
                              surname: profileSurname,
                              firstNameMatch: firstNameMatch,
                              surnameMatch: lastNameMatch
                            }} />

                            <Box sx={{ display: 'flex', color: 'white', flexDirection: 'column', alignItems: 'center', marginLeft: '154px', width: '287px' }}>
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
                              <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: '32px', width: '100%', paddingLeft: '32px', paddingRight: '32px' }}>
                                <Box sx={{ display: 'flex' }}>
                                  <Typography variant="h6" display="block" marginRight="12px" fontWeight="400">First name</Typography>
                                  <Typography variant="h6" display="block" marginLeft="auto">{proofFirstName}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                  <Typography variant="h6" display="block" marginRight="12px" fontWeight="400">Surname</Typography>
                                  <Typography variant="h6" display="block" marginLeft="auto">{proofSurname}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title="Creating Proof" subtitle="Accept transaction to create proof" />
                  </Box>
                  :
                  undefined
              }
            </Box>
          )}
        </TrackBox>
      </InstallExtensions>

      <WizardNav {...{
        sx: { marginTop: '32px', },
        prev: "Back",
        next: 'Create Proof Of Authenticity',
        nextDisabled,
        onPrev: previousPage,
        onNext,
      }} />
    </form>
  );
}));
