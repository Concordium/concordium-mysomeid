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
  useMediaQuery,
  useTheme,
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
import { useTemplateStore } from './template-store';
import { ErrorAlert } from 'src/components';

function capitalize(s: string) {
  if (!s?.length) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ProfileInfo = {
  name: string;
};

export function parseNameFromNameString(name: string) {
  let profileFirstName = '';
  let profileSurname = '';
  try {
    const profileNameComponents = (name?.split(' ') ?? []).filter(x => !!x.trim());
    profileFirstName = profileNameComponents[0] ?? '';
    profileFirstName = capitalize(profileFirstName.toLowerCase());
  } catch (e) {
    console.error(e);
  }

  try {
    const profileNameComponents = (name?.split(' ') ?? []).filter(x => !!x.trim());
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

const connectError = (<>
  You must Connect your Concordium ID to continue.<br />
  <br />
  Ensure you have completed the set up of your Concordium Account by completing the Concordium wallet set up.<br/>
  <br/>
  (If you have already created an account please refresh the browser and click continue)
</>);

const noAccountInWallet = (<>
  To continue please open the Concordium wallet extension and set up your Concordium Account.<br/>
  <br/>
  (If you have already created an account please refresh the browser and click continue)
</>);

export default connect(state => ({
  userId: selector(state, 'userId'),
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
    valid,
    previousPage,
  } = props;

  const {
    updateProps: templateUpdateProps,
    platform,
    userId,
    proof,
    name,
    statementInfo,
    profilePicUrl,
  } = useTemplateStore(props, ['proof', 'challenge', 'name', 'statementInfo']);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const theme = useTheme();
  const lt1130 = useMediaQuery(theme.breakpoints.down(1130));

  const [
    connectWithIDLoading,
    setConnectWithIDLoading
  ] = useState(false);

  const [
    connecting,
    setConnecting
  ] = useState(false);

  useEffect(() => {
    if (!userId || !platform || !name) {
      console.log("no user data or platform or profileInfo");
      navigate('/create/1?previousFailed');
      return;
    }
  }, [userId, platform, name]);

  const [showError, setShowError] = useState<any>(null);

  const {
    createProofStatement,
    installed,
    isConnected,
    isConnecting,
    connectAsync,
    account,
  } = useCCDContext();

  const nextDisabled = !userId || !platform || !valid || isConnecting || connectWithIDLoading;
  const opacity = isConnecting || connectWithIDLoading ? 0.1 : 1;

  const nextLabel = !statementInfo ?
    !isConnected ?
      'Connect Concordium Wallet'
      :
      'Connect Concordium ID'
    :
    'Next';

  const prevDisabled = connectWithIDLoading;

  const {
    profileFirstName,
    profileSurname,
  } = parseNameFromNameString(name);

  const [
    triggerOnNext,
    setTriggerOnNext,
  ] = useState(false);

  const onNext = useCallback(() => {
    if (connectWithIDLoading) {
      console.error("Already loading - ignored");
      return;
    }
   
    if ( connecting ) {
      console.error("Already connecting - ignored");
      return;
    }
    
    if (proof) {
      nextPage();
      return;
    }

    if (!isConnected) {
      setConnecting(true);
      connectAsync().then((addr) => {
        if (!addr) {
          setConnecting(false);
          dispatch(error('Failed to connect wallet'));
          return;
        }
        setShowError(null);
        setTimeout(() => {
          setConnecting(false);
          setTriggerOnNext(true);
        }, 1000);
    }).catch((err => {
        console.error(err);
        setConnecting(false);
        if ( err?.message === 'No account in the wallet' ) {
          setShowError(noAccountInWallet);
        } else {
          setShowError(connectError);
        }
      }));
      return;
    }

    setConnectWithIDLoading(true);

    createProofStatement({
      firstName: profileFirstName,
      surName: profileSurname,
      platform,
      userData: userId,
      account,
    }).then((retval: { challenge: string, proof: IdProofOutput, statement: any }) => {
      const {
        challenge,
        proof,
        statement,
      } = retval ?? {};
      if (challenge && proof) {
        templateUpdateProps(props, {
          'statementInfo': statement,
          'proof': proof,
          'challenge': challenge,
        });
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
  }, [
    props,
    isConnected,
    isConnecting,
    connecting,
    userId,
    proof,
    profileFirstName,
    profileSurname,
    platform,
    account,
    connectWithIDLoading,
  ]);

  useEffect(() => {
    if ( !triggerOnNext ) {
      return;
    }
    setTriggerOnNext(false);
    onNext();
  }, [triggerOnNext]);

  return (
    <form>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
          {({ width, height }: { width: number, height: number }) => (
            <>
              <Box id="layout-column" sx={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: minLayoutBoxHeight }}>
                <FormSubstepHeader header="Your Profile to Secure" desc={userId ?? ' '} sx={{ opacity }} />

                <Box id="layout-centered" sx={{ display: 'flex', justifyContent: 'center', marginTop: '24px', width: '100%', opacity }}>

                  <ProofCreatedConfirmation {...{
                    profileImageUrl: profilePicUrl,
                    userData: userId,
                    profileFirstName,
                    profileSurname,
                    sx: {
                      width: !lt1130 ? '25%' : '50%',
                    }
                  }} />

                  <Box sx={{ display: 'flex', justifyContent: 'center', width: !lt1130 ? '25%' : '50%', marginLeft: '5%', flexDirection: 'column' }}>
                    <Typography variant="h6" display="block">You have now gathered the information from the social media account you wish to verify, and the next step is to compare and connect this information with your Concordium ID.</Typography>
                  </Box>
                </Box>
              </Box>

              {!!showError ?
                <ErrorAlert sx={{
                  maxWidth: '728px',
                  marginTop: '28px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  opacity,
                }} >
                  {showError}
                </ErrorAlert>
              : undefined}

              {
                isConnecting || connectWithIDLoading ?
                  <Box id="loader-container" sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title={isConnecting ? 'Connecting wallet' : "Getting Identity"} subtitle="" />
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


