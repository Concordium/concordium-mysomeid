import {useState, useCallback, useEffect, useRef} from 'react';
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
  Certificate
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
import formName, {selector} from './form-props';
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
import {BackgroundEditor, downloadBase64File} from './background-editor';
import { defaultProofColor } from 'src/themes/theme';
import { Command, createCommand } from '../view-proof/view-proof';

export {BackgroundEditor};

export default connect(state => ({
  ...(selector(state,
    'userData',
    'platform',
    'profileInfo',
    'statementInfo',
    'proofData',
  )  ?? {})
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
  } = props;

  const params = useSearchParams();

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

  const [state, setState] = useState(1);

  const [showLastHint, setShowLastHint] = useState(false);

  const uri = [proofBaseUri, 'v', proofData?.id, encodeURIComponent(proofData?.decryptionKey) ].join('/');
  const [editorContentElement, setEditorContentElement] = useState(null);

  useEffect(() => {
    if ( !userData || !platform || !profileInfo || !statementInfo ) {
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
  if ( uriPresetable.length > (n * 2) + 3  ) {
    uriPresetable = uriPresetable.slice(0, n) + '...' + uriPresetable.slice(uriPresetable.length - n);
  }

  /* const downloadQR = useCallback(() => {
    toImg('#qr-code-canvas', `proof-${platform}-${proofData?.id}`, {
      scale: 1,
      format: 'png',
      quality: 1,
      download: true,
    }).then().catch( () => {
      dispatch(error("Failed to download"));
    });
    setDownloaded(true);
  }, []);*/

  const d = 256;

  const notSpec = '';

  let profileImageUrl: string;
  try {
    profileImageUrl = profileInfo?.profileInfo?.profileImage;
  } catch(e) {
    console.error(e);
  }

  let profileFirstName = '';
  let profileSurname = '';
  try {
    const profileNameComponents = (profileInfo?.profileInfo?.name?.split(' ') ?? []).filter( x => !!x.trim() );
    profileFirstName = profileNameComponents[0] ?? '';
    profileSurname = profileNameComponents[profileNameComponents.length - 1] ?? '';
  } catch(e) {
    console.error(e);
  }

  let firstName = ""; 
  try {
    firstName = statementInfo?.proof?.value.proofs[0]?.attribute;
  } catch(e) {
    console.error(e);
  }

  let lastName = ""; 
  try {
    lastName = statementInfo?.proof?.value.proofs[1]?.attribute;
  } catch(e) {
    console.error(e);
  }

  let country = "";
  try {
    country = statementInfo?.proof?.value.proofs[2]?.attribute;
  } catch(e) {
    console.error(e);
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

  const profilePageUrl = `https://linkedin.com/in/${userData}/`;
 
  const [getPic] = useState<Command>(createCommand());

  const [showLoading, setShowLoading] = useState(false);

  const nextDisabled = showLoading; // false; // !downloaded;
  const prevDisabled = true;

  const onNext = useCallback(() => {
    // navigate("/home");
    if ( state === 1 ) {
      setState(2);
    } else if ( state === 2 ) {
      setState(3);
    } else if ( state === 3 ) {
      if ( !userData ) {
        throw new Error('Invalid linked in username' + userData);
      }

      setShowLoading(true);
      getPic.exec().then((dataUrl) => {
        if ( !dataUrl ) {
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
        }).then (forward => {
          if ( forward ) {
            ext.openLinkedInSinceRegistrationIsDone(profilePageUrl);
            return;
          } else {
            downloadBase64File(dataUrl, 'mysomeid-linkedin-proof.png');
            setShowLoading(false);
            setState(4);
          }
        });

      }).catch(e => {
        console.error("Error", e);
        dispatch(error('Failed to embed proof'));
        setShowLoading(false);
      });
    } else if( state === 4 ) {
      window.location.href = profilePageUrl;
    }
  }, [getPic, state, editorContentElement]);

  const nextCaption = state === 1 ? "Next" :
                    state === 2 ? 'Next' :
                      state === 3 ? (ext.installed ? "Open LinkedIn" : "Done") :
                      "Open LinkedIn";

  const theme = useTheme();
  const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
  const ltmd = useMediaQuery(theme.breakpoints.down('md'));

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const changeBackground = useCallback(() => {
    imageInputRef?.current?.click();
  }, [imageInputRef]);

  const [manualBg, setManualBg] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState(null);

  // const [selColor, setSelColor] = useState(0);

  /* const color = [
    'rgb(205, 90, 109)',
    '#79d179',
    '#54a9c5',
    '#e4b5e7',
    'grey',
    // 'white',
  ]; */

  /* const onColorClicked = useCallback((event: any) => {
    setSelColor(Number.parseInt(event.target.id.split('-')[1]));
  }, []); */
  
  useEffect(() => {
    if ( manualBg ) {
      setBgImg(manualBg);
    } else if ( [null, 'default', ''].indexOf(profileInfo?.profileInfo?.backgroundImage ?? null) === -1 ) {
      setBgImg(profileInfo?.profileInfo?.backgroundImage);
    } else {
      setBgImg(defaultBackground)
    }
  }, [defaultBackground, manualBg, profileInfo, profileInfo?.profileInfo?.backgroundImage]);

  const onImageChanged = useCallback((event: any) => {
    const data = event?.target?.files?.[0] ? URL.createObjectURL(event?.target?.files?.[0]) : null;
    setManualBg(data);
  }, []);

  return (
    <form>

      <TrackBox id="container-box" sx={{display: 'flex', flexDirection: 'column', }}>
      {({width, height}: {width: number, height: number}) => (
        <>
          {state === 1 ?
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1}}>
                <Typography variant="h3" display="block" fontWeight="500" fontSize="2.2rem">Your Proof is Ready</Typography>
                <Certificate {...{
                  mobileVersion: ltmd, 
                  profilePageUrl,
                  profileImageUrl,
                  uri,
                  userData,
                  profileFirstName: proofFirstName,
                  profileSurname: proofSurname,
                  country,
                  sx: {marginTop: !ltmd ? '16px': '38px'},
                  showConnectWithLinkedIn: false,
                }}/>
            </Box> : 
            
            state === 2 ? 
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1 }}>
                <Typography variant="h3" display="block" fontWeight="500" fontSize="2.2rem">Connect With LinkedIn</Typography>
               
                <Certificate {...{
                  mobileVersion: ltmd,
                  profilePageUrl,
                  profileImageUrl,
                  uri,
                  userData,
                  profileFirstName: proofFirstName,
                  profileSurname: proofSurname,
                  country,
                  sx: {marginTop: !ltmd ? '16px': '38px'},
                  showConnectWithLinkedIn: true,
                }}/>

            </Box>
            : state === 3 ?
            
            /* This is the editor */
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1}}>
                <Typography variant="h3" display="block"><strong>Connect With LinkedIn</strong></Typography>
                <Typography variant="h6" display="block">Next, create and embed the Proof in your LinkedIn profile.  Follow the guide to update your LinkedIn background picture.</Typography>

                <Box sx={{marginTop: '24px', display: 'flex', flexDirection: 'column', width: '90%'}}>
                  <BackgroundEditor {...{
                    getPic,
                    bgImg,
                    id: proofData?.id ?? '',
                    uri,
                    widgetColor: defaultProofColor,
                  }} />
                </Box>

            </Box>
            : // state 4 
            <Box>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1}}>
                  <Typography variant="h3" display="block"><strong>Upload background to LinkedIn Profile</strong></Typography>
                  <Typography variant="h6" display="block"><strong>Your new background image has been downloaded to your Downloads folder.</strong></Typography>
                  <Typography variant="h6" display="block"><strong>Click Next to go to linked in order to upload it as the background of your LinkedIn profile</strong></Typography>
              </Box>
            </Box>
          }
          {
            showLoading ?
              <Box sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                <WizardLoading title="Loading" subtitle="Embedding QR code" />
              </Box>
              :
              undefined
          }
        </>
      )}
      </TrackBox>

      <WizardNav {...{
        sx: {marginTop: '32px'},
        prev: 'Back',
        next: nextCaption,
        prevDisabled,
        nextDisabled,
        onPrev: previousPage,
        onNext,
      }} />
    </form>
  );
}));
