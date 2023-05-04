import {
    useCallback,
    useEffect,
    useState
} from "react";
import {
    Box, Typography,
} from '@mui/material';
import {
    MobileCertificate
} from 'src/views/mobile/view-proof/certificate';
import { useCCDContext } from "src/hooks";
import { useParams } from "react-router-dom";
import { linkedInProfileBaseUrl, proofBaseUri } from 'src/constants';
import { AspectBox } from "src/views/desktop/new-proof/aspect-box";
import { MobileHeader } from './mobile-header';
import { Button } from 'src/components';

export const MobileViewProofView = ({ }) => {
    const {
        id,
        decryptionKey: decryptionKeyEncoded
    } = useParams();
    const decryptionKey = decodeURIComponent(decryptionKeyEncoded);
    const [profileFirstName, setFirstName] = useState('');
    const [profileSurname, setSurname] = useState('');
    const [platform, setPlatform] = useState('');
    const [userData, setUserData] = useState('');
    const [uri, setUri] = useState('');
    const [profilePageUrl, setProfilePageUrl] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');

    // const [proofLoaded, setProofLoaded] = useState(false);
    const [loadingProof, setLoadingProof] = useState(false);
    const [failedLoadingProof, setFailedLoadingProof] = useState(false);
    const [w, setWidth] = useState(0);

    const {
        loadProof,
    } = useCCDContext();

    useEffect(() => {
        if (!id || !decryptionKey) {
            setFailedLoadingProof(true);
            setLoadingProof(false);
            return;
        }
        setLoadingProof(true);
        loadProof(id, decryptionKey).then(({proofData: data}) => {
            setFirstName(data.firstName);
            setSurname(data.surName);
            setPlatform(data.platform);
            setUserData(data.userData);
            setProfileImageUrl(data.profileImageUrl);
            setUri([proofBaseUri, 'v', id, encodeURIComponent(decryptionKey)].join('/'));
            setProfilePageUrl(`${linkedInProfileBaseUrl}${data.userData}`);
            setFailedLoadingProof(false);
            setLoadingProof(false);
        }).catch(err => {
            console.error(err);
            setLoadingProof(false);
            setFailedLoadingProof(true);
        });
    }, [id, decryptionKey]);

    const onWidth = useCallback((w: number) => {
        setWidth(w);
    }, []);

    return (
        <Box sx={{}}>
            <AspectBox id="background-panel" aspect={1.25} sx={{
                background: 'rgb(45, 155, 240)',
                width: '100%',
            }} onWidth={onWidth}>
                <MobileHeader />
            </AspectBox>

            {/* Proof Panel */}
            <Box sx={{ width: '100%', display: 'flex', placeContent: 'center', marginTop: `-${Math.abs(Math.round(w))}px` }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '-24px' }}>

                    <MobileCertificate {...{
                        uri,
                        userData,
                        profileFirstName,
                        profileSurname,
                        id,
                        decryptionKey
                    }} />

                    <Box display="flex" flexDirection="column" sx={{ textAlign: 'center', margin: '0px 32px 32px 32px', padding: '0px 16px 0px 16px' }} >
                        <Typography sx={{fontSize: '14px', fontWeight: 400}}>
                            To verify the proof for yourself go to the linkedin profile you came from. Locate the URL of the profile, the user-id is the last part of the URL <i>(linkedin.com/ln/xxxxxx).</i> Paste it above and press "Verify Profile".
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '16px', paddingLeft: '32px', paddingRight: '32px', marginBottom: '16px' }}>
                            <Typography sx={{fontSize: '12px', fontWeight: 400, marginTop: '8px'}}>
                                Interested in verifying yourself and protecting your social media accounts? 
                            </Typography>
                            <Button variant="primary" sx={{marginTop: '16px !important', fontSize: '14px !important',}} onClick={() => {
                                window.open('https://mysome.id', '_blank');
                            }}>
                                Learn More
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
