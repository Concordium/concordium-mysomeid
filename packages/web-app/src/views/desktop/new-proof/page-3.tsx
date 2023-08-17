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
import { error } from 'src/slices';
import { InstallExtensions } from './install-extensions';
import { minLayoutBoxHeight } from './form-consts';
import { FormSubstepHeader } from './page-4';
import { useTemplateStore } from './template-store';
import { ErrorAlert } from 'src/components';

import { useAPI } from 'src/hooks/use-api';
import { useAnalytics } from 'src/hooks/use-analytics';

type PlatformProfileRepresentationArgs = {
  userData: string;
  profileImageUrl: string;
  platform: 'li',
  profileName: string;
  nameMatch?: boolean;
};

export const PlatformProfileRepresentation = ({
  userData,
  profileImageUrl,
  platform,
  profileName,
  nameMatch: nameMatch = null,
}: PlatformProfileRepresentationArgs) => {
  const nameIsInvalid = nameMatch !== null && !nameMatch;
  const linkedInNameStyle = {
    color: nameIsInvalid ? 'red' : undefined,
    fontWeight: nameIsInvalid ? 600 : undefined,
    textDecoration: nameIsInvalid ? 'underline' : undefined,
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '287px', }}>
      {platform === 'li' ? <Typography display="flex" variant="h6" fontSize="16px" fontWeight="400">LinkedIn<LinkedInIcon sx={{ marginTop: '2px', width: '21px', height: '21px' }} /></Typography> : undefined}
      <Typography variant="h6"  display="block">{userData ?? '?'}</Typography>
      <Box sx={{
        width: '140px',
        height: '140px',
        background: `url(${profileImageUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        borderRadius: '1111px',
        marginTop: '24px'
      }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: '32px', width: '100%', paddingLeft: '32px', paddingRight: '32px' }}>
        <Box sx={{ display: 'flex' }}>
          <Typography variant="h6" display="block" margin="auto" sx={linkedInNameStyle}>{profileName}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default connect(state => ({
  ...(selector(state,
    'platform',
    'userId',
    'statementInfo',
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
  } = props;
  
  const {
    updateProps: templateUpdateProps,
    userId,
    platform,
    name,
    statementInfo,
    proofData,
    proof,
    challenge,
    profilePicUrl,
    backgroundPicUrl,
  } = useTemplateStore(props, ['name', 'userId', 'platform', 'statementInfo', 'proof', 'proofData', 'challenge', 'profilePicUrl', 'backgroundPicUrl']);
 
  const [creating, setCreating] = useState(false);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const analytics = useAnalytics();

  const {
    isConnected,
    connect,
    createProofSBNFT,
  } = useCCDContext();

  const {
    fuzzyNameMatch    
  } = useAPI();

  const [creatingProof, setCreatingProof] = useState(false);
  const [proofCreated, setProofCreated] = useState(!!proofData);

  useEffect(() => {
    if (!userId || !platform || !name || !statementInfo || !proof) {
      navigate('/create/1?previousFailed');
      return;
    }
  }, [userId, platform, name, statementInfo, proof]);

  useEffect(() => {
    analytics.track({type: 'create-proof-step', options: {stepNumber: 3}});
  }, []);

  let state = !creatingProof ?
    !isConnected ?
      'show-connect'
      :
      'create-proof'
    :
    'create-proof';

  let proofFirstName = "";
  try {
    proofFirstName = proof?.proof?.value.proofs[0]?.attribute;
  } catch (e) {
    console.error(e);
  }

  let proofSurname = "";
  try {
    proofSurname = proof?.proof?.value.proofs[1]?.attribute;
  } catch (e) {
    console.error(e);
  }

  let profileImageUrl: string;
  try {
    profileImageUrl = profilePicUrl;
  } catch (e) {
    console.error(e);
  }

  let profileBackgroundUrl: string;
  try {
    profileBackgroundUrl = backgroundPicUrl;
  } catch (e) {
    console.error(e);
  }

  const [nameStatus, setNameStatus] = useState<{name: string, matching: boolean | null} | null >(null);

  const theme = useTheme();

  const lt900 = useMediaQuery(theme.breakpoints.down(900));

  useEffect(() => {
    if ( nameStatus?.name !== name ) {
      setNameStatus({...nameStatus, name, matching: null});
    }

    if ( nameStatus?.matching === null ) {
      fuzzyNameMatch(nameStatus?.name, proofFirstName, proofSurname).then(({matching}) => {
        setNameStatus({...nameStatus, matching});
      }).catch(() => {
        dispatch(error("Failed to validate name"));
      });
    }
  }, [name, nameStatus?.name, nameStatus?.matching]);

  const nextDisabled = state === 'show-connect' || creating || !nameStatus?.matching;

  const prevDisabled = creatingProof;

  const onNext = useCallback(() => {
    if (proofData) {
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
      profileName: [proofFirstName, proofSurname].join(' '),
      userId: userId,
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
      templateUpdateProps(props, {
        proofData: {
          id: newProof.id,
          decryptionKey: newProof.decryptionKey,
          tx: newProof.tx,
        }
      });
      nextPage();
    }).catch(e => {
      setCreatingProof(false);
      setProofCreated(false);
      setCreating(false);
      dispatch(error(e?.message ?? 'Error storing proof on Concordium'));
    });
  }, [proofFirstName, proofSurname, proofData, userId, challenge, platform, proof, statementInfo]);

  const showLoading = creatingProof;

  const nextLabel = !proofCreated ? 'Create Proof Of Authenticity' : 'Next';

  return (
    <form>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
          {({ width, height }: { width: number, height: number }) => (
            <Box id="layout-column" sx={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: minLayoutBoxHeight }}>
              <FormSubstepHeader header="Create Proof Of Authenticity" desc="Connect your Profile with your Concordium ID" sx={{ opacity: showLoading ? 0.1 : 1 }} />

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
                ) : state === 'create-proof' ? (
                  <Box id="create-proof" sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                            userData: userId,
                            platform,
                            profileImageUrl,
                            profileName: name,
                            nameMatch: nameStatus?.matching,
                          }} />

                          <Box sx={{ display: 'flex', color: 'white', flexDirection: 'column', alignItems: 'center', marginLeft: '154px', width: '287px' }}>
                            <FormSubstepHeader header="Your Digital ID" desc="Concordium Identity" />
                            <Box sx={{
                              width: '140px',
                              height: '140px',
                              background: `url(${concordiumLogoSvg})`,
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: 'cover',
                              borderRadius: '1111px',
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

                    {statementInfo && proof && (nameStatus?.matching === false) ?
                    <ErrorAlert sx={{
                      maxWidth: '728px',
                      marginTop: '28px',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }} >
                      Your name doesn't match the name in your Concordium ID.  Consider renaming your LinkedIn profile name to match your Concordium ID name.
                    </ErrorAlert> : undefined}

                  </Box>
                ) :
                  undefined
                }
              </Box>

              {
                showLoading ?
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title="Creating Proof" subtitle="Processing transaction to create proof" />
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
        next: nextLabel,
        prevDisabled,
        nextDisabled,
        onPrev: previousPage,
        onNext,
      }} />
    </form>
  );
}));
