import { useState, useCallback, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    WizardNav
} from 'src/views/desktop/new-proof/wizard-nav';
import { LoadingIndicator } from "src/components";
import { useNavigate } from "react-router-dom";
import { useCCDContext } from "src/hooks/use-ccd-context";
import { Certificate } from "../new-proof/certificate";
import { TrackBox } from "../new-proof/track-box";
import { useDispatch } from "react-redux";
import { error } from "src/slices/messages-slice";
import { BackgroundEditor } from "../new-proof/background-editor";
import { proofBaseUri, linkedInProfileBaseUrl } from "src/constants";
import { defaultProofColor } from "src/themes/theme";
import { useExtension } from "src/hooks/use-extension";

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

export const BackgroundEditorView = ({ uri, id, showLoading }: { uri: string, id: string, showLoading: boolean }) => {
    // const [editorContentElement, setEditorContentElement] = useState(null);
    // const [selColor, setSelColor] = useState(0);

    /* const color = [
      'rgb(205, 90, 109)',
      '#79d179',
      '#54a9c5',
      '#e4b5e7',
      'grey',
      // 'white',
    ]; */

    const theme = useTheme();

    const lt800 = useMediaQuery(theme.breakpoints.down(800));
    // const lt620 = useMediaQuery(theme.breakpoints.down(620));

    return (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', opacity: showLoading ? 0.1 : 1 }}>
            <Typography variant="h3" display="block"><strong>LinkedIn profile image</strong></Typography>
            <Typography variant="h6" display="block"><strong>Edit and download your profile image</strong></Typography>
            <Box sx={{ marginTop: '24px', display: 'flex', flexDirection: 'column', width: lt800 ? '96%' : '80%' }}>
                <BackgroundEditor {...{
                    controls: true,
                    getPic: null,
                    id,
                    bgImg: localStorage.getItem("reg_store_bg_" + id) ?? null,
                    uri,
                    widgetColor: defaultProofColor
                }} />
            </Box>
        </Box>
    );
};

const generateRandomString = () => {
    const randomBytes = new Array(20)
        .fill(null)
        .map(() => Math.floor(Math.random() * 256));
    return randomBytes.map(byte => ('0' + byte.toString(16)).slice(-2)).join('');
};

const encryptedPlaceholder = '<encrypted>';

export function ViewProof({ id, noRevoke, decryptionKey }: { id: string, noRevoke?: boolean, decryptionKey: string }) {
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
    const ext = useExtension();

    const {
        revokeProof,
        account,
        isConnected,
        loadProof,
        loadProofMetadata,
    } = useCCDContext();

    const [proofLoaded, setProofLoaded] = useState(false);
    const [loadingProof, setLoadingProof] = useState(false);
    const [metaDataLoaded, setMetaDataLoaded] = useState(false);
    const [revoked, setRevoked] = useState<boolean | null>(null);
    const [owner, setOwner] = useState<string | null>(null);

    const [failedLoadingProof, setFailedLoadingProof] = useState(false);

    const isRevoked = revoked === true;
    const ownerIsNotConnectedAccount = (account && owner && account.trim().toLowerCase() !== owner.trim().toLowerCase());

    let revokeDisabled = 
        !isConnected || // Revoke disabled when not connected to wallet
        ownerIsNotConnectedAccount || // Disabled when account is diffirent than the owned account
        isRevoked || // Disabled when already revoked
        doneRevoking || // Disabled when done revoking ( also if failed revoking )
        revokingProof || // Dissabled while revoking proof / loading
        (failedLoadingProof && !decryptionKey) || // Disabled if failed to load metadata ( it shoudl be enabled when encruption key is enabled and failed to load)
        loadingProof; // Disabled while loading proof

    
    let nextDisabledReason = revokeDisabled ?
            isConnected ? 'Your Concordium Wallet is not connected and you cannot revoke the proof.' :
            ownerIsNotConnectedAccount ? 'Only the Concordium account that owns the proof can revoke it.':
            null:
        null;

    const [showEditor, setShowEditor] = useState(false);
    const doShowEditor = useCallback(() => {
        setShowEditor(true);
    }, []);
    
    // If the decryptrion Key doesnt exist we can still determine if its revoked using
    // the end-point that doesnt take a removed parameter. (this is needed if the user no longer has a locally stored copy)
    useEffect(() => {
        if (metaDataLoaded || failedLoadingProof) {
            return;
        }

        setLoadingProof(true);
        loadProofMetadata(id).then(metaData => {
            setOwner(metaData.owner);
            setRevoked(metaData.revoked === true);
            setMetaDataLoaded(true);
        }).catch(err => {
            console.error(err);
            setFailedLoadingProof(true);
        });
    }, [id, metaDataLoaded, failedLoadingProof, decryptionKey]);

    useEffect(() => {
        if (proofLoaded) {
            return;
        }

        if (failedLoadingProof) {
            return;
        }

        if (!metaDataLoaded) {
            return;
        }

        setLoadingProof(true);

        if (!decryptionKey) {
            setFirstName(encryptedPlaceholder);
            setSurname(encryptedPlaceholder);
            setPlatform('li');
            setUserData(encryptedPlaceholder);
            setUri([proofBaseUri, 'v', id, encodeURIComponent(generateRandomString())].join('/'));
            setUserData(encryptedPlaceholder);
            setProfileImageUrl('https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh');
            setProfilePageUrl(linkedInProfileBaseUrl + encryptedPlaceholder);
            setLoadingProof(false);
            return;
        }

        loadProof(id, decryptionKey).then(({ proofData: data }) => {
            setFirstName(data.firstName);
            setSurname(data.surName);
            setPlatform(data.platform);
            setUserData(data.userData);
            setProfileImageUrl(data.profileImageUrl ?? 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh');
            setRevoked(data.revoked === true);
            setUri([proofBaseUri, 'v', id, encodeURIComponent(decryptionKey)].join('/'));
            setProfilePageUrl(linkedInProfileBaseUrl + data.userData);
            setLoadingProof(false);
        }).catch(err => {
            console.error(err);
            setLoadingProof(false);
            setFailedLoadingProof(true);
        });
    }, [id, proofLoaded, failedLoadingProof, decryptionKey, metaDataLoaded]);

    const onPrev = useCallback(() => {
        if (showEditor) {
            setShowEditor(false);
            return;
        }
        navigate("/home");
    }, [showEditor]);

    const onRevoke = useCallback(() => {
        if (revoked) {
            return;
        }
        if (!doneRevoking && !revokingProof) {
            setRevoking(true);
            revokeProof({ id }).then(() => {
                console.log("Done revoking!");
                setRevoking(false);
                setDoneRevoking(true);
                ext.reloadTabs({ contains: 'linkedin' });
            }).catch(err => {
                console.error(err);
                setRevoking(false);
                dispatch(error('Failed to revoke the proof'));
            });
        }
    }, [revoked, doneRevoking]);

    const theme = useTheme();
    const ltsm = useMediaQuery(theme.breakpoints.down('sm'));
    const ltmd = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={{ backgroundColor: 'white', paddingTop: !ltmd ? '24px' : undefined }}>
            {!showEditor ?
                <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', }}>
                    {({ width, height }: { width: number, height: number }) => (
                        <>
                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '48px', opacity: revoked || doneRevoking || failedLoadingProof || revokingProof ? 0.15 : undefined }}>
                                <Certificate {...{
                                    owner,
                                    loading: loadingProof,
                                    profilePageUrl: profilePageUrl,
                                    profileImageUrl: profileImageUrl,
                                    uri: uri,
                                    userData: userData,
                                    profileFirstName: profileFirstName,
                                    profileSurname: profileSurname,
                                    mobileVersion: ltmd,
                                    blurQRCode: profileFirstName === encryptedPlaceholder
                                }} />
                            </Box>

                            {failedLoadingProof || revoked || doneRevoking || revokingProof ?
                                <Box id="revoking-container" sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                                    {failedLoadingProof && !doneRevoking && !revokingProof ?
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                                        </Box> : undefined}
                                    {!doneRevoking && revokingProof ?
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                                                    <Typography display="block" sx={{ textAlign: 'center', lineHeight: '1.3', float: 'left' }}>
                                                        Accept the transaction to revoke the proof
                                                    </Typography>
                                                    <br />
                                                    <br />
                                                    <LoadingIndicator />
                                                </Box>
                                            </Box>
                                        </Box>
                                        : undefined}

                                    {revoked || (doneRevoking && !failedLoadingProof && !revokingProof) ?
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                                                    {doneRevoking ? <Typography display="block" sx={{ textAlign: 'center', lineHeight: '1.3', float: 'left' }}>
                                                        Done revoking proof
                                                    </Typography> : undefined}
                                                    <br />
                                                    <br />
                                                    <LoadingIndicator sx={{ visibility: 'hidden' }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                        : undefined}
                                </Box> : undefined}
                        </>
                    )}
                </TrackBox> :
                <BackgroundEditorView {...{ uri, id, showLoading: false }} />}
            <WizardNav {...{
                prev: 'Back',
                onPrev,
                next: !noRevoke && !showEditor ? 'Revoke' : undefined,
                nextDisabledReason,
                onNext: onRevoke,
                extraButton: !noRevoke && !showEditor ? 'Download Proof Again' : undefined,
                extraButtonDisabled: profileFirstName === encryptedPlaceholder || revoked || doneRevoking || revokingProof,
                onExtraButton: doShowEditor,
                nextDisabled: revokeDisabled,
            }} />
        </Box>
    );
}
