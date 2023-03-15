import { useState, useCallback, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    WizardNav
} from 'src/views/new-proof/wizard-nav';
import { LoadingIndicator } from "src/components";
import { useNavigate } from "react-router-dom";
import { useCCDContext } from "src/hooks/use-ccd-context";
import { Certificate } from "../new-proof/certificate";
import { TrackBox } from "../new-proof/track-box";
import { useDispatch } from "react-redux";
import { error } from "src/slices/messages-slice";
import { BackgroundEditor } from "../new-proof/page-4";
import { Button } from 'src/components/ui/button';
import defaultBackground from 'src/images/background-default.png';
import DownloadIcon from '@mui/icons-material/Download';

export type Command = {
    subscribe: (fn: () => void) => () => void;
    exec: () => any;
};

export const createCommand = (): Command => {
    let fn: () => void | null = null;
    const subscribe = (_fn: () => void) => {
        fn = _fn;
        return () => {
            fn = null;
        };
    };
    const exec = (): any => {
        return fn?.();
    };
    return {
        subscribe,
        exec,
    };
}

export const BackgroundEditorView = ({uri, id, showLoading}: {uri: string, id: string, showLoading: boolean}) => {
    const [editorContentElement, setEditorContentElement] = useState(null);
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

    useEffect(() => {
        const bgInCache = localStorage.getItem("reg_store_bg_" + id) ?? null;
        if ( bgInCache ) {
            setBgImg(bgInCache);    
        } else {
            setBgImg(defaultBackground);
        }
    }, []);

    useEffect(() => {
        if ( manualBg ) {
          setBgImg(manualBg);
        }
    }, [manualBg]);
    
    const onImageChanged = useCallback((event: any) => {
        const data = event?.target?.files?.[0] ? URL.createObjectURL(event?.target?.files?.[0]) : null;
        setManualBg(data);
    }, []);
    
    const onColorClicked = useCallback((event: any) => {
        setSelColor(Number.parseInt(event.target.id.split('-')[1]));
    }, []);

    const imageInputRef = useRef<HTMLInputElement | null>(null);
            
    const [saveAndDl] = useState<Command>(createCommand());

    const onDownload = useCallback(() => {
        saveAndDl.exec();
    }, [saveAndDl]);

    const changeBackground = useCallback(() => {
        imageInputRef?.current?.click();
    }, [imageInputRef]);

    const setDefaultBg = useCallback(() => {
        setBgImg(defaultBackground);
    }, []);

    const theme = useTheme();

    const lt800 = useMediaQuery(theme.breakpoints.down(800));
    const lt620 = useMediaQuery(theme.breakpoints.down(620));

    return (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1}}>
            <Typography variant="h3" display="block"><strong>LinkedIn profile image</strong></Typography>
            <Typography variant="h6" display="block"><strong>Edit and download your profile image</strong></Typography>
            <input ref={imageInputRef} accept="image/*" type="file" onChange={onImageChanged} style={{display: 'none'}}/>

            <Box sx={{marginTop: '24px', display: 'flex', flexDirection: 'column', width: lt800 ? '96%' : '80%'}}>
                <BackgroundEditor {...{saveAndDl, getPic: null, id, bgImg, uri, widgetColor: color[selColor] ?? 'rgb(205, 90, 109)'}} />
                <Box sx={{display: 'flex', flexDirection: lt620 ? 'column' : 'row', marginBottom: !lt620 ? '24px' : '16px', marginTop: '8px'}}>
                    <Box sx={{display: 'flex', flexDirection: 'row', height: "36px", alignItems: 'center', paddingTop: '16px'}}>
                        <Button variant="weak" sx={{minWidth: '32px', marginRight: '8px'}} onClick={onDownload}><DownloadIcon /></Button>
                        <Button variant="weak" sx={{minWidth: '148px', marginRight: '8px'}} onClick={changeBackground}>Set Background</Button>
                        <Button variant="weak" sx={{minWidth: '90px'}} onClick={setDefaultBg}>Default</Button>
                    </Box>
                    <Box sx={{display: 'flex', flex: 1, flexDirection: 'row', height: "36px", alignItems: 'center', paddingTop: '16px'}}>
                        {color.map((color, index) => (
                            <Box id={"col-" + index} key={`col-${index}`} sx={{cursor: 'pointer', marginLeft: '8px', marginTop: '2px', minWidth: '18px', width: '18px', height: '18px', background: color, border: selColor === index ? '1px solid black' : color === 'white' ? '1px solid #b0b0b0' : undefined, borderRadius: '24px'}} onClick={onColorClicked} />
                        ))}
                        {!lt800 ? <Typography height="36px" variant="h6"  width="100%" textAlign="right" marginRight="8px" fontSize="0.5rem" display="flex" alignItems="center" justifyContent="right">Drag the proof to move it to a diffirent location</Typography>: undefined}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export function ViewProof({id, noRevoke}: {id: string, noRevoke?: boolean}) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [revokingProof, setRevoking] = useState(false);
    const [doneRevoking, setDoneRevoking] = useState(false);
    const [profileFirstName, setFirstName] = useState('');
    const [profileSurname, setSurname] = useState('');
    const [, setPlatform] = useState('');
    const [userData, setUserData] = useState('');
    const [uri, setUri] = useState('');
    const [profilePageUrl, setProfilePageUrl] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');

    const {
        revokeProof,
        loadProof,
    } = useCCDContext();

    const [proofLoaded, setProofLoaded] = useState(false);
    const [loadingProof, setLoadingProof] = useState(false);

    const [failedLoadingProof, setFailedLoadingProof] = useState(false);

    const nextDisabled = doneRevoking || revokingProof || revokingProof || failedLoadingProof || loadingProof;
    const [showEditor, setShowEditor] = useState(false);
    const doShowEditor = useCallback(() => {
        setShowEditor(true);
    }, []);

    useEffect(() => {
        if (proofLoaded) {
            return;
        }
        setLoadingProof(true);
        loadProof(id).then((data) => {
            setFirstName(data.firstName);
            setSurname(data.lastName);
            setPlatform(data.platform);
            setUserData(data.userData);
            setProfileImageUrl(data.profileImageUrl);
            setUri('https://app.mysomeid.dev/v/' + id);
            setProfilePageUrl('https://www.linkedin.com/in/' + data.userData);
            setLoadingProof(false);
        }).catch(err => {
            console.error(err);
            setLoadingProof(false);
            setFailedLoadingProof(true);
        });
    }, [id, proofLoaded]);
    
    const onPrev = useCallback(() => {
        if ( showEditor ) {
            setShowEditor(false);
            return;
        }
        navigate("/home");
    }, [showEditor]);
   
    const onRevoke = useCallback(() => {
        if ( !doneRevoking && !revokingProof ) {
            setRevoking(true);
            revokeProof({id}).then( () => {
                console.log("Done revoking!");
                setRevoking(false);
                setDoneRevoking(true);
            } ).catch(err => {
                console.error(err);
                setRevoking(false);
                dispatch(error('Failed to revoke the proof'));
            });
        }
    }, [doneRevoking]);

    const theme = useTheme();
    const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
    const ltmd = useMediaQuery(theme.breakpoints.down('md'));

    // console.log("ltmd", ltmd, " ltsm ", ltsm);

    return (
        <Box sx={{backgroundColor: 'white', paddingTop: !ltmd ? '24px' : undefined}}>
            {!showEditor ? 
            <TrackBox id="container-box" sx={{display: 'flex', flexDirection: 'column', }}>
            {({width, height}: {width: number, height: number}) => (
                <>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '48px', opacity: doneRevoking || failedLoadingProof || revokingProof ? 0.15 :undefined }}>
                        <Certificate {...{
                            loading: loadingProof,
                            profilePageUrl: revokingProof ? '' : profilePageUrl,
                            profileImageUrl: revokingProof ? '' : profileImageUrl,
                            uri: revokingProof ? '' : uri,
                            userData: revokingProof ? '' : userData,
                            profileFirstName: revokingProof ? '' : profileFirstName,
                            profileSurname: revokingProof ? '' : profileSurname,
                            mobileVersion: ltmd,
                        }}/>
                    </Box>

                    {failedLoadingProof || doneRevoking || revokingProof ?
                    <Box id="revoking-container" sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                        {failedLoadingProof && !doneRevoking && !revokingProof ? 
                            <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '8px',
                                    marginRight: 'auto',
                                    width: '100%',
                                }}>
                                    <Box sx={{
                                            width: '100%',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="h5" sx={{}}>
                                            Failed loading proof
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box> : undefined }
                        { !doneRevoking && revokingProof ? 
                            <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '8px',
                                    marginRight: 'auto',
                                    width: '100%',
                                }}>
                                    <Box sx={{
                                            width: '100%',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="h5" sx={{}}>
                                        Revoking Proof
                                        </Typography>
                                        <Typography display="block" sx={{textAlign: 'center', lineHeight: '1.3', float: 'left'}}>
                                        Accept the transaction to revoke the proof
                                        </Typography>
                                        <br />
                                        <br />
                                        <LoadingIndicator />
                                    </Box>
                                </Box>
                            </Box>
                        : undefined }

                        { doneRevoking && !failedLoadingProof && !revokingProof ? 
                            <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '8px',
                                    marginRight: 'auto',
                                    width: '100%',
                                }}>
                                    <Box sx={{
                                            width: '100%',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="h5" sx={{}}>
                                        Proof Revoked
                                        </Typography>
                                        <Typography display="block" sx={{textAlign: 'center', lineHeight: '1.3', float: 'left'}}>
                                        Done revoking proof
                                        </Typography>
                                        <br />
                                        <br />
                                        <LoadingIndicator sx={{visibility: 'hidden'}}/>
                                    </Box>
                                </Box>
                            </Box>
                        : undefined }
                    </Box> : undefined}
                </>
            )}
            </TrackBox> : 
            <BackgroundEditorView {...{uri, id, showLoading: false}} />}
            <WizardNav {...{
                prev: 'Back',
                onPrev,
                next: !noRevoke && !showEditor ? 'Revoke' : undefined,
                onNext: onRevoke,
                extraButton: !noRevoke && !showEditor? 'Download Proof Again' : undefined,
                onExtraButton: doShowEditor,
                nextDisabled,
            }} />
        </Box>
    );
}
