import {
  connect,
  useDispatch
} from 'react-redux';
import {
  reduxForm,
} from 'redux-form';
import validate from './validate';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  WizardNav
} from './wizard-nav';
import formName, { selector } from './form-props';
import { useCallback, useEffect, useState } from 'react';
import { useCCDContext } from 'src/hooks';
import { error } from 'src/slices/messages-slice';
import { useNavigate } from 'react-router-dom';
import {
  WizardLoading,
} from './wizard-loading';
import { TrackBox } from './track-box';
import { IdProofOutput } from '@concordium/common-sdk';
import { InstallExtensions } from './install-extensions';
import { minLayoutBoxHeight } from './form-consts';
import { FormSubstepHeader, ProofCreatedConfirmation } from './page-4';

function capitalize(s: string) {
  if (!s?.length) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ProfileInfo = {
  name: string;
};

export function parseNameAndCountry(profileInfo: ProfileInfo) {
  console.log('parseNameAndCountry ', profileInfo);
  let profileFirstName = '';
  let profileSurname = '';
  try {
    const profileNameComponents = (profileInfo?.name?.split(' ') ?? []).filter(x => !!x.trim());
    profileFirstName = profileNameComponents[0] ?? '';
    profileFirstName = capitalize(profileFirstName.toLowerCase());
  } catch (e) {
    console.error(e);
  }

  try {
    const profileNameComponents = (profileInfo?.name?.split(' ') ?? []).filter(x => !!x.trim());
    profileSurname = profileNameComponents[profileNameComponents.length - 1] ?? '';
    profileSurname = capitalize(profileSurname.toLowerCase());
  } catch (e) {
    console.error(e);
  }

  return {
    profileFirstName,
    profileSurname,
    // country: country ?? 'N/A',
  };
}

export default connect(state => ({
  userData: selector(state, 'userData'),
  platform: selector(state, 'platform'),
  authorised: selector(state, 'authorised'),
  profileInfo: selector(state, 'profileInfo'),
  statementInfo: selector(state, 'statementInfo'),
  challenge: selector(state, 'challenge'),
  proof: selector(state, 'proof'),
}))(reduxForm({
  form: formName,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
})((props) => {
  const {
    nextPage,
    prevPage,
    pristine,
    valid,
    previousPage,
    userData,
    platform,
    profileInfo,
    statementInfo,
    template,
  } = props;

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [
    connectWithIDLoading,
    setConnectWithIDLoading
  ] = useState(false);

  useEffect(() => {
    if (!userData || !platform || !profileInfo) {
      console.log("no user data or platform or profileInfo");
      navigate('/create/1?previousFailed');
      return;
    }
  }, [userData, platform, profileInfo, statementInfo]);

  const {
    createProofStatement,
    isConnected,
    connect,
    account,
  } = useCCDContext();

  const nextDisabled = !userData || !platform || pristine || !valid || connectWithIDLoading;

  const nextLabel = !statementInfo ?
    !isConnected ?
      'Connect Concordium Wallet'
      :
      'Connect Concordium ID'
    :
    'Next';

  /*
    <Box sx={{marginTop: '16px' }}>
    <Button variant="contained" sx={{
      minWidth: '100px',
      marginLeft: '8px',
      padding: '6px 16px',
      opacity: statementInfo ? 0.1 : 1,
    }} disabled={statementInfo} disableRipple onClick={authorize}>{!isConnected ? 'Connect Concordium Wallet' : 'Connect With Your Concordium ID'}</Button>
    </Box>
  */

  const prevDisabled = connectWithIDLoading;

  const profileImageUrl = profileInfo?.profileInfo?.profileImage;

  // console.log("profileImageUrl ", profileImageUrl);

  const {
    profileFirstName,
    profileSurname,
  } = parseNameAndCountry(profileInfo?.profileInfo);

  const onlyUrl = profileInfo?.profileInfo?.onlyUrl ?? true; // when this is returned the paltform cannto give us a name,
  // console.log("profileInfo ", profileInfo);

  const cancel = useCallback(() => {
    prevPage();
  }, []);

  const onNext = useCallback(() => {
    if (nextDisabled) {
      console.error('next disabled.');
    }

    if (connectWithIDLoading) {
      console.error("Already loading - ignored");
      return;
    }

    if (!isConnected) {
      connect();
      return;
    }

    if (statementInfo) {
      nextPage();
      return;
    }

    setConnectWithIDLoading(true);

    createProofStatement({
      firstName: profileFirstName,
      surName: profileSurname,
      platform,
      userData,
      account,
    }).then((retval: { challenge: string, proof: IdProofOutput }) => {
      const {
        challenge,
        proof
      } = retval ?? {};
      console.log(JSON.stringify(proof, null, ' '));
      if (challenge && proof) {
        props.change('statementInfo', proof);
        props.change('proof', proof);
        props.change('challenge', challenge);
        window.setTimeout(() => nextPage()); // Allow promise to finalize before state is destroyed.
      } else {
        const startMsg = 'Failed to Authorise: ';
        let errMsg = 'Unknown error';
        if (!challenge) {
          errMsg = 'No challenge';
        } else if (!proof) {
          errMsg = 'No proof created in wallet';
        } else {
          errMsg = 'Unkown error';
        }
        console.error('Error: ' + errMsg);
        dispatch(error(`${startMsg} Unknown error`));
      }
    }).catch(e => {
      console.error('Authorise failed', e);
      dispatch(error("Failed to Authorise: " + e.message));
    }).finally(() => {
      console.log('Authorise is done done');
      setConnectWithIDLoading(false);
    });
  }, [props, userData, profileFirstName, profileSurname, platform, account, connectWithIDLoading]);

  return (
    <form>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
          {({ width, height }: { width: number, height: number }) => (
            <>
              <Box id="layout-column" sx={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: minLayoutBoxHeight }}>
                <FormSubstepHeader header="Your Profile to Secure" desc={userData ?? ' '} sx={{ opacity: connectWithIDLoading ? 0.1 : 1 }} />

                <Box id="layout-centered" sx={{ display: 'flex', justifyContent: 'center', marginTop: '24px', width: '100%', opacity: connectWithIDLoading ? 0.1 : 1 }}>

                  <ProofCreatedConfirmation {...{
                    profileImageUrl,
                    userData,
                    profileFirstName,
                    profileSurname,
                    sx: {
                      width: '25%',
                    }
                  }} />

                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '25%', marginLeft: '5%', flexDirection: 'column' }}>
                    <Typography variant="h6" display="block">You have now gathered the information from the social media account you wish to verify, and the next step is to compare and connect this information with your Concordium ID.</Typography>
                  </Box>
                </Box>
              </Box>

              {
                connectWithIDLoading ?
                  <Box id="loader-container" sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title="Getting Identity" subtitle="" />
                  </Box>
                  :
                  undefined
              }
            </>
          )}
        </TrackBox>
      </InstallExtensions>

      <WizardNav sx={{ marginTop: '32px', }} prev={"Back"} prevDisabled={prevDisabled} nextDisabled={nextDisabled} next={nextLabel} onNext={onNext} onPrev={previousPage} />
    </form>);
}));


