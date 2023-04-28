import { useState, useCallback, useEffect, useRef } from 'react';
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
  useMediaQuery,
} from '@mui/material';
import {
  useCCDContext,
} from 'src/hooks';
import {
  WizardNav
} from './wizard-nav';
import {
  Certificate, ProofWidget
} from './certificate';
import defaultBackground from 'src/images/background-default.png';
import logoSvg from 'src/images/logo-white.svg';
import {
  useSearchParams
} from 'src/hooks/use-search-params';
import toImg from 'react-svg-to-image';
import {
  useExtension
} from 'src/hooks/use-extension';
import formName, { selector } from './form-props';
import { error } from 'src/slices/messages-slice';
import {
  proofBaseUri,
} from 'src/constants';
import {
  TrackBox
} from './track-box';
import {
  WizardLoading
} from './wizard-loading';
import { BackgroundEditor, downloadBase64File } from './background-editor';
import { defaultProofColor } from 'src/themes/theme';
import { Command, createCommand } from '../view-proof/view-proof';
import ColoredRectSvg from 'src/images/rect.svg';

import {
  minLayoutBoxHeight
} from './form-consts'
import { InstallExtensions } from './install-extensions';
import { PlatformProfileRepresentation } from './page-3';

export { BackgroundEditor };

export const FormSubstepHeader = ({header, desc, sx}: {header: string, desc?: string, sx?: any}) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" sx={{...(sx ?? {})}}>
      <Typography key={header} variant="h3" display="block"><strong>{header}</strong></Typography>
      {desc !== undefined ? <Typography key={desc} variant="h6" display="block">{desc}</Typography> : undefined}
    </Box>
  )
};

type ProofCreatedConfirmationArgs = {
  profileImageUrl: string;
  userData: string;
  platform?: 'li',
  profileFirstName: string;
  profileSurname: string;
  sx?: any;
};

export const ProofCreatedConfirmation = ({
  profileImageUrl,
  userData,
  platform: platform = 'li',
  profileFirstName,
  profileSurname,
  sx,
}: ProofCreatedConfirmationArgs) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-evenly', ...(sx ?? {}) }}>
      <Box sx={{ display: 'flex', background: `url(${ColoredRectSvg})`, height: '402px', paddingTop: '24px' }}>
        <PlatformProfileRepresentation {...{ // Show the profile content inside the box.
          userData,
          platform,
          profileImageUrl,
          firstName: profileFirstName,
          surname: profileSurname,
        }} />
      </Box>
    </Box>
  );
};

export default connect(state => ({
  ...(selector(state,
    'userData',
    'platform',
    'profileInfo',
    'statementInfo',
    'proofData',
    'confirmationSeen'
  ) ?? {})
}))(reduxForm({
  form: formName,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
})(props => {
  const {
    previousPage,
    userData,
    platform,
    profileInfo,
    statementInfo,
    proofData,
    confirmationSeen,
  } = props;

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [
    downloaded,
    setDownloaded
  ] = useState(false);

  const [
    urlSet,
    setUrlSet,
  ] = useState(false);

  const {
    isConnected,
  } = useCCDContext();

  const ext = useExtension();

  const [state, setState] = useState<'confirmation' | 'editor' | 'fallback'>(!confirmationSeen ? 'confirmation' : 'editor');

  const uri = [proofBaseUri, 'v', proofData?.id, encodeURIComponent(proofData?.decryptionKey)].join('/');
  const [editorContentElement, setEditorContentElement] = useState(null);

  useEffect(() => {
    if (!userData || !platform || !profileInfo || !statementInfo) {
      navigate('/create/1?previousFailed');
      return;
    }
  }, [userData, platform, profileInfo, statementInfo]);

  useEffect(() => {
    if (uri && proofData?.id && userData && !urlSet) {
      setUrlSet(true);
      ext.setQRUrl(platform, userData, uri);
    }
  }, [uri, proofData, userData, urlSet]);

  let uriPresetable = uri;
  const n = 12;
  if (uriPresetable.length > (n * 2) + 3) {
    uriPresetable = uriPresetable.slice(0, n) + '...' + uriPresetable.slice(uriPresetable.length - n);
  }

  let profileImageUrl: string;
  try {
    profileImageUrl = profileInfo?.profileInfo?.profileImage;
  } catch (e) {
    console.error(e);
  }

  let profileFirstName = '';
  let profileSurname = '';
  try {
    const profileNameComponents = (profileInfo?.profileInfo?.name?.split(' ') ?? []).filter(x => !!x.trim());
    profileFirstName = profileNameComponents[0] ?? '';
    profileSurname = profileNameComponents[profileNameComponents.length - 1] ?? '';
  } catch (e) {
    console.error(e);
  }

  let firstName = "";
  try {
    firstName = statementInfo?.proof?.value.proofs[0]?.attribute;
  } catch (e) {
    console.error(e);
  }

  let lastName = "";
  try {
    lastName = statementInfo?.proof?.value.proofs[1]?.attribute;
  } catch (e) {
    console.error(e);
  }

  let country = "";
  try {
    country = statementInfo?.proof?.value.proofs[2]?.attribute;
  } catch (e) {
    console.error(e);
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

  const profilePageUrl = `https://linkedin.com/in/${userData}/`;

  const [getPic] = useState<Command>(createCommand());

  const [showLoading, setShowLoading] = useState(false);

  const prevDisabled = showLoading;

  const nextDisabled = showLoading;

  const onNext = useCallback(() => {
    if (state === 'confirmation' ) {
      props.change('confirmationSeen', true);
      setState('editor');
      return;
    }
    
    if (state === 'editor') {
      if (!userData) {
        throw new Error('Invalid linked in username' + userData);
      }

      setShowLoading(true);
      getPic.exec().then((dataUrl) => {
        if (!dataUrl) {
          dispatch(error('Failed to capture image as QR code proof.'));
          setShowLoading(false);
          return;
        }

        ext.updateRegistration({
          platform: 'li',
          proofId: proofData?.id ?? '',
          step: 5, // Last step.
          username: userData,
          userData,
          backgroundImage: profileInfo?.profileInfo?.backgroundImage,
          url: profileImageUrl,
          image: dataUrl, // this is the image url.
        }).then(forward => {
          ext.openLinkedInSinceRegistrationIsDone(profilePageUrl);
          return;
        });

      }).catch(e => {
        console.error("Error", e);
        dispatch(error('Failed to embed proof'));
        setShowLoading(false);
      });
      return;
    }
  }, [getPic, state, editorContentElement]);

  const nextCaption = state === 'confirmation' ? "Upload Badge" :
    state === 'editor' ? 'Upload badge to your LinkedIn' :
        "Next";

  const [bgImg, setBgImg] = useState(null);

  useEffect(() => {
    if ([null, 'default', ''].indexOf(profileInfo?.profileInfo?.backgroundImage ?? null) === -1) {
      setBgImg(profileInfo?.profileInfo?.backgroundImage);
    } else {
      setBgImg(defaultBackground)
    }
  }, [defaultBackground, profileInfo?.profileInfo?.backgroundImage]);

  console.log("profileInfo?.profileInfo?.backgroundImage ", profileInfo?.profileInfo?.backgroundImage);

  return (
    <form>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
          {({ width, height }: { width: number, height: number }) => (
            <Box id="layout-column" sx={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: minLayoutBoxHeight }}>
              {state === 'confirmation' ?
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1 }}>
                  <FormSubstepHeader header="Congratulations!" desc="Your Proof is ready" />

                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100% !important',
                    marginTop: '40px',
                    justifyContent: 'center !important'
                  }}>
                    <Box sx={{
                      flexDirection: 'row',
                      display: 'flex',
                      alignItems: 'top',
                      maxWidth: '50% !important',
                    }}>
                      <ProofCreatedConfirmation {...{
                        profileImageUrl,
                        userData,
                        profileFirstName: proofFirstName,
                        profileSurname: proofSurname,
                      }} />
                      <ProofWidget {...{
                        uri,
                        sx: {
                          alignSelf: 'flex-end',
                          transform: 'scale(0.75)',
                          marginBottom: '64px',
                          marginLeft: '-78px',
                          marginRight: '78px',
                          boxShadow: '0px 0px 35px 8px rgba(0,0,0,0.4)',
                        }
                      }} />
                    </Box>

                    <Box sx={{display: 'flex', maxWidth: '50%', alignItems: 'center'}}>
                      <Box sx={{maxWidth: '300px'}}>
                        <Typography>
                          You have created a proof of authenticity for your social media account.<br/>
                          <br/>
                          Now finalize the process by uploading the badge with the QR code to your LinkedIn profile.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box> 

              : state === 'editor' ? /* This is the editor */
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1 }}>
                  <FormSubstepHeader header="Upload Badge" desc="Preview of badge displayed on your profile" />

                  <Box sx={{ marginTop: '24px', display: 'flex', flexDirection: 'column', width: '90%' }}>
                    <BackgroundEditor {...{
                      getPic,
                      bgImg,
                      id: proofData?.id ?? '',
                      uri,
                      widgetColor: defaultProofColor,
                    }} />
                  </Box>

                </Box>
              : state === 'fallback' ? /* state 3 - show fallback if it cannot store backgrond */
                <Box>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1 }}>
                    <Typography variant="h3" display="block"><strong>Upload background to LinkedIn Profile</strong></Typography>
                    <Typography variant="h6" display="block">Your new background image has been downloaded to your Downloads folder.</Typography>
                    <Typography variant="h6" display="block">Click Next to go to linked in order to upload it as the background of your LinkedIn profile</Typography>
                  </Box>
               </Box>              
              : // invalid state
                undefined
              }

              {
                showLoading ?
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title="Loading" subtitle="Embedding QR code" />
                  </Box>
                  :
                  undefined
              }
            </Box>
          )}
        </TrackBox>
        <WizardNav {...{
          sx: { marginTop: '32px' },
          prev: 'Back',
          next: nextCaption,
          prevDisabled,
          nextDisabled,
          onPrev: previousPage,
          onNext,
        }} />
      </InstallExtensions>
    </form>
  );
}));
