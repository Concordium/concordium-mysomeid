import {
    useEffect,
    useState
} from "react";
import {
    Box, 
    Typography
} from '@mui/material';
import {
    Certificate
} from 'src/views/new-proof/certificate';
import { useCCDContext } from "src/hooks";
import {
    Button
} from 'src/components';
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
  
export const MobileViewProofView = ({}) => {
    const {id} = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [revokingProof, setRevoking] = useState(false);
    const [doneRevoking, setDoneRevoking] = useState(false);
    const [profileFirstName, setFirstName] = useState('');
    const [profileSurname, setSurname] = useState('');
    const [activeValid, setActiveValid] = useState('Check in app');
    const [urlMatch, setUrlMatch] = useState('Check in app');
    const [issueDate, setIssueDate] = useState('Check in app');
    const [platform, setPlatform] = useState('');
    const [userData, setUserData] = useState('');
    const [uri, setUri] = useState('');
    const [profilePageUrl, setProfilePageUrl] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');

    const [proofLoaded, setProofLoaded] = useState(false);
    const [loadingProof, setLoadingProof] = useState(false);
    const [failedLoadingProof, setFailedLoadingProof] = useState(false);

    const {
        revokeProof,
        loadProof,
    } = useCCDContext();

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

    return (
      <Box sx={{
        position: 'fixed',
        display: 'flex',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'white',
        flexDirection: 'column',
        overflowY: 'scroll',
      }}>
        {/*Topbar*/}
        <Box sx={{
          position: 'sticky',
          background: 'rgb(32,35,69)',
          width: '100%',
          height: '48px',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
        }}>
          <Typography sx={{color: 'white'}}>
            MYSOME.ID
          </Typography>
        </Box>
  
        <Box sx={{width: '100%', display: 'flex', placeContent: 'center',}}>
            <Box sx={{display: 'flex', flexDirection: 'column', marginTop: '-24px'}}>

                <Box display="flex" flexDirection="column" sx={{background: '#dfdfdf', borderRadius: '16px', textAlign: 'center',margin: '32px', marginTop: '56px', padding: '16px'}} >
                    <Typography display="block" sx={{ fontSize: '1rem', lineHeight: '1.3', float: 'left'}}>
                        You have scanned a MYSOME identity proof
                    </Typography>
                    <Typography marginTop="16px" display="block" sx={{fontSize: '1rem', lineHeight: '1.3', float: 'left'}}>
                        The proof ties the SoMe profile to a real-world person using the Concordium Blockchain.
                    </Typography>
                </Box>

                <Certificate {...{
                    mobileVersion: true,
                    hideBorder: true,
                    hideQR: true,
                    header: 'Summary',
                    subHeader: 'of proof of identity',
                    sx: {
                        // minWidth: '800px',
                    },
                    profilePageUrl,
                    profileImageUrl,
                    uri,
                    userData,
                    profileFirstName,
                    profileSurname,
                    activeValid,
                    urlMatch,
                    issueDate
                }} />
                <Box sx={{display: 'flex', flexDirection: 'column', paddingLeft: '32px', paddingRight: '32px', marginBottom: '32px'}}>
                    <Button variant="primary" sx={{height: '42px'}}>
                        Check if proof is still valid
                    </Button>
                </Box>
            </Box>
        </Box>
      </Box>
    );
};


export function ViewProofOld({id}: {id: string}) {
    const [state, setState] = useState({
        validated: false,
        validating: false,
    });

    const ccd = useCCDContext();

    useEffect(() => {
        
    }, []);

    const summary = [
        {
            name: 'Platform',
            value: 'jkh' ?? ',',
        },
        {
            name: 'Name',
            value: 'jkhg' ?? ',',
        },
    ];

    const creationDate = '2023-01-01';
    const profilePageUrl = 'http://linkedin.com/in/joemoe-1234';
    const profileImageUrl = 'https://media.licdn.com/dms/image/D5603AQGKYh-_QAoMqA/profile-displayphoto-shrink_800_800/0/1673006091287?e=1680739200&v=beta&t=deXBtk9QDmF8JHj5BpjYrrSoUdGOVFL_U7GBG2cWhe8';
    const uri = 'http://linkedin.com/in/joemoe-1234';
    const userData = 'joemoe-1234';
    const profileFirstName = 'Joe';
    const profileSurname = 'Moe';
    const country = 'DK';

    return (
        <Box sx={{backgroundColor: 'white'}}>

            <Box sx={{width: '100%', display: 'flex', placeContent: 'center',}}>
                <Box sx={{display: 'flex', flexDirection: 'column', marginTop: '-24px'}}>
                    <Box maxWidth="800px" display="flex" flexDirection="column" sx={{paddingTop: '24px', paddingRight: '23px'}} >
                        <Typography display="block" sx={{textAlign: 'left', fontSize: '1rem', lineHeight: '1.3', float: 'left'}}>
                            You have scanned a proof of ownership on a social media profile of a real-world person using the Concoridium Layer 1 Blockchain!
                        </Typography>
                        <Typography marginTop="16px" display="block" sx={{textAlign: 'left', fontSize: '1rem', lineHeight: '1.3', float: 'left'}}>
                            The proof secures a LinkedIn account for the user {profileFirstName} {profileSurname}. It was created on {creationDate} by {profileFirstName} {profileSurname} using a verified Concordium Identity profile and is active.
                        </Typography>
                    </Box>

                    <Certificate {...{
                        sx: {
                            minWidth: '800px',
                        },
                        profilePageUrl,
                        profileImageUrl,
                        uri,
                        userData,
                        profileFirstName,
                        profileSurname,
                        country,
                    }} />

                </Box>
            </Box>
        </Box>
    );
}

