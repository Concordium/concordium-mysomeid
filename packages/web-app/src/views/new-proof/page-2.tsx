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
  Button,
  Typography,
} from '@mui/material';
import {
  WizardNav
} from './wizard-nav';
import formName, {selector} from './form-props';
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

function capitalize (s: string) {
  if ( !s?.length ) {
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
    const profileNameComponents = (profileInfo?.name?.split(' ') ?? []).filter( x => !!x.trim() );
    profileFirstName = profileNameComponents[0] ?? '';
    profileFirstName = capitalize(profileFirstName.toLowerCase());
  } catch(e) {
    console.error(e);
  }

  try {
    const profileNameComponents = (profileInfo?.name?.split(' ') ?? []).filter( x => !!x.trim() );
    profileSurname = profileNameComponents[profileNameComponents.length - 1] ?? '';
    profileSurname = capitalize(profileSurname.toLowerCase());
  } catch(e) {
    console.error(e);
  }

  // The country string contains diffirent characters. 
  /*const country = (capitalize(profileInfo?.country?.trim()) ?? '')
                    .split(',')
                    .map(x => x.trim())
                    .reduce((acc: string[], x: string) => {
                      return [
                        ...acc,
                        countries.find(y => y.name.toLowerCase() === x?.toLowerCase())?.code ??
                          countries.find(y => y.code === x?.toLowerCase())?.code ??
                            null
                      ];
                    }, [])
                    .filter(x => !!x)
                    .find( x => !!x );*/

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
    if ( !userData || !platform || !profileInfo ) {
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

  const nextDisabled = !userData || !platform || pristine || !valid || !statementInfo || connectWithIDLoading;

  const prevDisabled = connectWithIDLoading;

  const profileImageUrl = profileInfo?.profileInfo?.profileImage;

  console.log("profileImageUrl ", profileImageUrl );

  const {
    profileFirstName,
    profileSurname,
  } = parseNameAndCountry(profileInfo?.profileInfo);

  const onlyUrl = profileInfo?.profileInfo?.onlyUrl ?? true; // when this is returned the paltform cannto give us a name,
  console.log("profileInfo ", profileInfo );

  const cancel = useCallback(() => {
    prevPage();
  }, []);

  const authorize = useCallback(() => {
    if ( connectWithIDLoading ) {
      console.error("Already loading - ignored");
      return;
    }

    if ( !isConnected )  {
      connect();
      return;
    }

    setConnectWithIDLoading(true);

    createProofStatement({
      firstName: profileFirstName,
      surName: profileSurname,
      platform,
      userData,
      account,
    }).then((retval: {challenge: string, proof: IdProofOutput}) => {
      const {
        challenge,
        proof
      } = retval ?? {};
      console.log(JSON.stringify(proof, null, ' '));
      if ( challenge && proof ) {
        props.change('statementInfo', proof );
        props.change('proof', proof);
        props.change('challenge', challenge);
        setConnectWithIDLoading(false);
        nextPage();
      } else {
        setConnectWithIDLoading(false);
        const startMsg = 'Failed to Authorise: ';
        let errMsg = 'Unknown error';
        if (!challenge ) {
          errMsg = 'No challenge';
        } else if ( !proof ) {
          errMsg = 'No proof created in wallet';
        } else {
          errMsg = 'Unkown error';
        }
        console.error('Error: ' + errMsg);
        dispatch(error(`${startMsg} Unknown error`));  
    }
    }).catch(e => {
      console.error('Authorise failed', e);
      setConnectWithIDLoading(false);
      dispatch(error("Failed to Authorise: " + e.message));
    }).finally(() => {
      console.log('Authorise is done done');
      setConnectWithIDLoading(false);
    });
  }, [props, userData, profileFirstName, profileSurname, platform, account, connectWithIDLoading]);


  return (
  <form onSubmit={nextPage}>
    <InstallExtensions>
      <TrackBox id="container-box" sx={{display: 'flex', flexDirection: 'column', }}>
        {({width, height}: {width: number, height: number}) => (
          <>
            <Box id="layout-column" sx={{display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '400px'}}>

              <Box id="layout-centered" sx={{display: 'flex', justifyContent: 'center', marginTop: '24px', width: '100%', height: '100%', position: 'absolute', opacity: connectWithIDLoading ? 0.1 : 1 }}>
                <Box id="statement-info" sx={{display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
                  <Typography variant="h3" display="block" sx={{fontWeight: 500}}>Your Profile to Secure</Typography>
                  <Typography variant="h6" display="block">{userData}</Typography>
                  <Box sx={{
                    width: '140px',
                    height: '140px',
                    background: `url(${profileImageUrl})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    borderRadius: '1111px',
                    border: '1px solid',
                    marginTop: '16px'
                  }} />
                  <Box sx={{display: 'flex', flexDirection: 'column', minWidth: '200px', marginTop: '16px'}}>
                    {
                      !onlyUrl ? 
                      <>
                        <Box sx={{display: 'flex'}}>
                          <Typography variant="h6" display="block" marginRight="12px">First name</Typography>
                          <Typography variant="h6" display="block" marginLeft="auto">{profileFirstName}</Typography>
                        </Box>
                        <Box sx={{display: 'flex'}}>
                          <Typography variant="h6" display="block" marginRight="12px">Surname</Typography>
                          <Typography variant="h6" display="block" marginLeft="auto">{profileSurname}</Typography>
                        </Box>
                      </> : 
                      <>
                        <Box sx={{display: 'flex'}}>
                          <Typography variant="h6" display="block" marginRight="12px">Platform</Typography>
                          <Typography variant="h6" display="block" marginLeft="auto">LinkedIn</Typography>
                        </Box>
                        <Box sx={{display: 'flex'}}>
                          <Typography variant="h6" display="block" marginRight="12px">User Id</Typography>
                          <Typography variant="h6" display="block" marginLeft="auto">{userData}</Typography>
                        </Box>
                      </>
                    }
                  </Box>
                  <Box sx={{marginTop: '16px' }}>
                    <Button variant="contained" sx={{
                      minWidth: '100px',
                      marginLeft: '8px',
                      padding: '6px 16px',
                      opacity: statementInfo ? 0.1 : 1,
                    }} disabled={statementInfo} disableRipple onClick={authorize}>{!isConnected ? 'Connect Concordium Wallet' : 'Connect With Your Concordium ID'}</Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            {
              connectWithIDLoading ?
                <Box id="loader-container" sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                  <WizardLoading title="Getting Identity" subtitle="" />        
                </Box>
                :
                undefined
            }
          </>
        )}
      </TrackBox>
    </InstallExtensions>

    <WizardNav sx={{marginTop: '32px',}} prev={"Back"} prevDisabled={prevDisabled} nextDisabled={nextDisabled} next={'Next'} onPrev={previousPage} />
  </form>);
}));


