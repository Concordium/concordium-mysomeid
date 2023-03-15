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
import QRCode from "react-qr-code";
import { error } from 'src/slices/messages-slice';
import * as htmlToImage from 'html-to-image';
import {
  proofBaseUri,
} from 'src/constants';
import {
  TrackBox
} from './track-box';
import {
  WizardLoading
} from './wizard-loading';
import {
  AspectBox
} from './aspect-box';
import { Button } from 'src/components/ui/button';
import { Command, createCommand } from '../view-proof/view-proof';

function px_pct_s(v: number, d: number): string {
  return ((v / d) * 100).toFixed(2) + '%';
}

function px_pct(v: number, d: number): number {
  return ((v / d) * 100);
}

function parseEvent(e: any, rect: any) {
  const {width: w, height: h, left, top} = rect;
  const x = e.clientX - left;
  const y = e.clientY - top;
  const rx = ((x / (w ?? 0.0001)) * 100); // .toFixed(2) + '%';
  const ry = ((y / (h ?? 0.0001)) * 100); // .toFixed(2) + '%';
  return {
    x, y,
    rx, ry,
  };
}

let _drag = false;
const _dragOffset = {x: 0, y: 0};
const factor = 1.33;
const box = {
  rw: px_pct(102 * factor, 1000),
  rh: px_pct(136 * factor, 250),
};

export function BackgroundEditor({saveAndDl, getPic, id, bgImg, uri, widgetColor}) {
  const refEditor = useRef(null);
  const refTarget = useRef(null);
  const refShadow = useRef(null);
  const refEditorContent = useRef(null);
  const [x, setX] = useState<string>('86.04%');
  const [y, setY] = useState<string>('25.41%');
  const [subscribed, setSubscribed] = useState(false);
  const [drag, setDrag] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // console.log("bgImg ", bgImg );
  const shadowScale = 1;

  const saveAndDownloadImpl = useCallback(() => {
    htmlToImage.toPng(refShadow?.current, {
      width: 1000,
      height: 250,
      canvasWidth: 1000,
      canvasHeight: 250,
      backgroundColor: 'white',
    }).then((dataUrl) => {
        downloadBase64File(dataUrl, 'mysomeid-linkedin-proof-' + id + '.png');
    });
  }, [refShadow?.current, id, refShadow]);

  useEffect(() => {
    return saveAndDl?.subscribe(() => {
      saveAndDownloadImpl();
    });
  }, []);

  useEffect(() => {
    return getPic?.subscribe(() => {
      return htmlToImage.toPng(refShadow?.current, {
        width: 1000,
        height: 250,
        canvasWidth: 1000,
        canvasHeight: 250,
        backgroundColor: 'white',
      });
    });
  }, [refShadow?.current]);

  const mv = useCallback(e => {
    if ( !_drag ) {
      // console.log('Drag ignore');
      return;
    } 
    // console.log('Drag move');
    const rect = e.target.getBoundingClientRect();
    const {rx, ry} = parseEvent(e, rect);
    const dorx = ((_dragOffset.x / (rect.width ?? 0.0001)) * 100); // .toFixed(2) + '%';
    const dory = ((_dragOffset.y / (rect.height ?? 0.0001)) * 100); // .toFixed(2) + '%';
    const px = rx - dorx;
    const py = ry - dory;
    const so1x = px + box.rw > 100 ? 100 - (px + box.rw) : 0; // > 100 ? (100 - px + box.rw) : 0;
    const so1y = py + box.rh > 100 ? 100 - (py + box.rh) : 0; // > 100 ? (100 - py + box.rh) : 0;
    const so2x = px < 0 ? -px : 0; // > 100 ? (100 - px + box.rw) : 0;
    const so2y = py < 0 ? -py : 0;
    const res_x = `${(px + so1x + so2x).toFixed(2)}%`;
    const res_y = `${(py + so1y + so2y).toFixed(2)}%`;
    setX(res_x);
    setY(res_y);
  }, [_drag]);

  const dn = useCallback(e => {
    // console.log('Drag start');
    // console.log("e", e);
    _dragOffset.x = e.offsetX;
    _dragOffset.y = e.offsetY;
    // console.log("down", _dragOffset);
    // px_pct(102, 1000)
    _drag = true; 
    const rect = e.target.getBoundingClientRect();
    // const {rx, ry} = parseEvent(e, rect);
    setDragOffset({x: e.offsetX, y: e.offsetY});
    setDrag(true);
  }, [_drag]);

  const up = useCallback(e => {
    // console.log('Drag end');
    // console.log("up");
    _drag = false;
    setDrag(false);
  }, [_drag]);

  useEffect(() => {
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mouseup', up);
    };
  }, []);

  useEffect(() => {
    refEditor.current?.addEventListener('mousemove', mv);
    refTarget.current?.addEventListener('mousedown', dn);
    refEditor.current?.addEventListener('mouseup', up);
    return () => {
      refEditor.current?.removeEventListener('mousemove', mv);
      refEditor.current?.removeEventListener('mousedown', dn);
      refEditor.current?.removeEventListener('mouseup', up);
    };
  }, [refEditor.current]);

  return (<>
    <Box {...{ref: refEditor, id: 'editor', sx: { overflow: 'hidden', background: "#F6F6F6", display: 'flex', width: '100%', boxShadow: '0px 0px 30px 2px rgba(0,0,0,0.16)'}}}>
      <AspectBox {...{
        id: "editor-content",
        aspect: 0.25,
        onWidth: (w: number) => setScale(w / 1000),
        sx: {
          width: "100%",
          background: `url("${bgImg}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        },
      }}>
          <Box ref={refTarget} sx={{
            width: `${box.rw}%`,
            height: `${box.rh}%`,
            left: x,
            top: y,
            position: `relative`,
            background: widgetColor,            
            pointerEvents: _drag ? 'none' : 'initial',
            borderRadius: `${Math.round(6 * scale)}px`,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            userSelect: 'none',
            cursor: 'grab',
          }}>
            <QRCode
              id="qr-code-canvas"
              value={uri}
              size={Math.round(94 * factor * scale)}
              viewBox={`0 0 256 256`}
              style={{
                height: `${Math.round(94 * factor * scale)}px`,
                width: `${Math.round(94 * factor * scale)}px`,
                marginTop: `${Math.round(4 * factor * scale)}px`,
              }}
            />
            
            <Box display="flex" sx={{marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none'}}>
              <Box sx={{
                background: `url(${logoSvg})`,
                width: `${Math.round(27 * factor * scale)}px`,
                height: `${Math.round(23 * factor * scale)}px`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                transform: 'scaleX(1.1)',
                marginRight: `${Math.round(8 * factor * scale)}px`,
                marginLeft: `${Math.round(-2 * factor * scale)}px`,
              }}/>
              <Typography sx={{fontSize: `${Math.round(8 * factor * scale)}px`, textAlign: 'center', color: 'white'}}>VERIFIED BY<br/>MYSOMEID</Typography>
            </Box>
          </Box>
      </AspectBox>
    </Box>

    <Box {...{id: 'editor-shadow', sx: {
      width: '1000px',
      height: '250px',
      marginLeft: '-999999999px',
      marginTop: '-250px',
      overflow: 'hidden',
      position: 'abosolute',
      background: "#F6F6F6",
      display: 'flex'
    }}}>
      <Box {...{
        ref: refShadow,
        id: "editor-shadow-content",
        sx: {
          width: "100%",
          background: `url("${bgImg}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        },
      }}>
        <Box sx={{
            width: `${box.rw}%`,
            height: `${box.rh}%`,
            left: x,
            top: y,
            position: `relative`,
            background: widgetColor,            
            pointerEvents: _drag ? 'none' : 'initial',
            borderRadius: `${Math.round(6 * shadowScale)}px`,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}>
            <QRCode
              id="qr-code-canvas"
              value={uri}
              size={Math.round(94 * factor * shadowScale)}
              viewBox={`0 0 256 256`}
              style={{
                height: `${Math.round(94 * factor * shadowScale)}px`,
                width: `${Math.round(94 * factor * shadowScale)}px`,
                marginTop: `${Math.round(4 * factor * shadowScale)}px`,
                pointerEvents: 'none',
              }}
            />
            
            <Box display="flex" sx={{marginTop: 'auto', marginBottom: 'auto', width: '100%', placeItems: "center", justifyContent: "center", pointerEvents: 'none'}}>
              <Box sx={{
                background: `url(${logoSvg})`,
                width: `${Math.round(27 * factor * shadowScale)}px`,
                height: `${Math.round(23 * factor * shadowScale)}px`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                transform: 'scaleX(1.1)',
                marginRight: `${Math.round(8 * factor * shadowScale)}px`,
                marginLeft: `${Math.round(-2 * factor * shadowScale)}px`,
                pointerEvents: 'none',
                userSelect: 'none',
              }}/>
              <Typography sx={{fontSize: `${Math.round(8 * factor * shadowScale)}px`, textAlign: 'center', color: 'white'}}>VERIFIED BY<br/>MYSOMEID</Typography>
            </Box>
          </Box>
      </Box>
    </Box>
  </>);
}


const downloadBase64File = (linkSource: string, fileName: string) => {
  const downloadLink = (document.getElementById('__imageDownload') ?? document.createElement("a")) as HTMLAnchorElement;
  downloadLink.id = "__imageDownload";
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.click();
};

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

  const uri = [proofBaseUri, 'v', proofData?.id ].join('/');
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

  console.log("profileInfo ", profileInfo );
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
            setTimeout(() => {
              // window.location.href = profilePageUrl; 
              console.log("DONE!!!!");
              ext.getRegistrations().then(regs => {
                console.log("registrations ", regs);
                debugger;
                window.location.href = profilePageUrl;
              });
            }, 1000);
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

  useEffect(() => {
    console.log(uri);
  }, []);

  const theme = useTheme();
  const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
  const ltmd = useMediaQuery(theme.breakpoints.down('md'));

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const changeBackground = useCallback(() => {
    imageInputRef?.current?.click();
  }, [imageInputRef]);

  const [manualBg, setManualBg] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState(null);

  const [selColor, setSelColor] = useState(0);

  const color = [
    'rgb(205, 90, 109)',
    '#79d179',
    '#54a9c5',
    '#e4b5e7',
    'grey',
    // 'white',
  ];

  const onColorClicked = useCallback((event: any) => {
    setSelColor(Number.parseInt(event.target.id.split('-')[1]));
  }, []);
  
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
                  <BackgroundEditor {...{saveAndDl: null, getPic, bgImg, id: proofData?.id ?? '', uri, widgetColor: color[selColor] ?? 'rgb(205, 90, 109)'}} />
                  <Box sx={{display: 'flex', flexDirection: 'row', height: "36px", alignItems: 'center', paddingTop: '16px'}}>
                    <Button variant="weak" sx={{minWidth: '168px'}} onClick={changeBackground}>Change background</Button>
                    {color.map((color, index) => {
                      return <Box id={"col-" + index} key={`col-${index}`} sx={{cursor: 'pointer', marginLeft: '8px', marginTop: '2px', minWidth: '18px', width: '18px', height: '18px', background: color, border: selColor === index ? '1px solid black' : color === 'white' ? '1px solid #b0b0b0' : undefined, borderRadius: '24px'}} onClick={onColorClicked} />
                    })}
                    <Typography height="36px" variant="h6" display="block" width="100%" textAlign="right">Drag the proof to move it to a diffirent location</Typography>
                    <input ref={imageInputRef} accept="image/*" type="file" onChange={onImageChanged} style={{display: 'none'}}/>
                  </Box>
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
