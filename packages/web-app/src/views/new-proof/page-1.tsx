import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  connect,
  useDispatch
} from 'react-redux';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  useLastLocation
} from "react-router-dom-last-location";
import {
  reduxForm,
  // Field,
  reset,
  // formValueSelector,
  // change,
} from 'redux-form';
import {
  Button,
  WizardRow
} from 'src/components';
import {
  WizardLoading,
} from './wizard-loading';
import validate from './validate';
import {
  Typography,
  Box,
  ListItemText,
  MenuItem,
} from "@mui/material";
import {
  WizardNav
} from './wizard-nav';
import {
  supportedSocialNetworks
} from './supported-social-networks';
import {
  renderSelect,
  renderTextField
} from './ui';
import logo from 'src/images/mysomeid-logo.svg';
import {
  serviceUrl,
  extensionUrl,
} from 'src/constants';
import formName, {selector} from './form-props';
import {
  useExtension
} from 'src/hooks/use-extension';

import LinkedInUsernameHelpPng from 'src/images/linkedin-user-name-help.png';
import { error } from 'src/slices/messages-slice';
import { toUnitless } from '@mui/material/styles/cssUtils';
import { width } from '@mui/system';
import useFetch from '@bloodyaugust/use-fetch';

import {TrackBox} from './track-box';

import {
  Timeout
} from 'src/utils';

import {
  InstallExtensions 
} from './install-extensions';

export default connect(state => ({
  platform: selector(state, 'platform'),
  userData: selector(state, 'userData'),
  profileInfo: selector(state, 'profileInfo'),
}))(reduxForm({
  form: formName,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
  initialValues: {
    platform: "0",
    userData: '',
    profileInfo: {},
    authorised: false,
    statementInfo: null,
    proof: null,
    proofData: null,
  },
})((props) => {
  const {
    nextPage,
    pristine,
    submitting,
    // network,
    platform,
    userData,
    template,
    // proofData,
  } = props;

  const {installed: browserExtInstalled} = useExtension();

  const [hasSetValuesFromTemplate, setHasSetValuesFromTemplate] = useState(false);

  const [fetchingProfileInfo, setFetchingProfileInfo] = useState(false);
  const [fetchingProfileName, setFetchingProfileName] = useState('');

  const [mounted, setMounted] = useState(false);

  const [userError, setUserError] = useState(null);

  const dispatch = useDispatch();

  const navigate = useNavigate();
  
  const [searchParams] = useSearchParams();

  const {lastLocation} = useLastLocation();
  // console.log("lastLocation ", lastLocation?.pathname);

  const previousFailed = searchParams.get('previousFailed');

  const fetchHandler = useFetch();

  useEffect(() => {
    if ( previousFailed !== null && previousFailed !== undefined ) {
      navigate("/create/1");
      dispatch(error('Wizard restart'));
    }
  }, [previousFailed]);

  useEffect(() => {
    if (!mounted) {
      if( ['/', '/home'].indexOf(lastLocation?.pathname) >= 0 ) {
        console.log("Resetting form");
        dispatch(reset(formName));
      }
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, [mounted]);

  useEffect(() => {
    if ( template && !hasSetValuesFromTemplate ) {
      if ( template.p === 'linked-in' )  {
        console.error("Fixing invalid platform valiue : linked-in");
        template.p = 'li';
      }
      if ( !template.userId ) {
        console.error("Error template contained no userId");
      }
      if ( !template.platform ) {
        console.error("Error template contained no platoform");
      }
      props.change('userData', template.userId);
      props.change('platform', template.platform);
      props.change('profilePicUrl', template.profilePicUrl);
      props.change('backgroundPicUrl', template.backgroundPicUrl);
      if ( template.skipFirstPage ) {
        // nextPage();
      }
      setHasSetValuesFromTemplate(true);
      onNext();
    }
  }, [template, hasSetValuesFromTemplate]);

  const handleBack = useCallback(() => {
    dispatch(reset(formName));
    navigate('/home');
  }, []);

  useEffect(() => {
    // HAck if user adds the whole linked in url by copy paste.
    if ( userData && userData.match(new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)) ) {
      let tmp = userData.toLowerCase();
      // console.log("name is a url");
      if ( tmp.indexOf('linkedin.com/in/') >= 0 ) {
        // console.log("tmp ", tmp );
        tmp = tmp.split('linkedin.com/in/');
        // console.log("tmp ", tmp );
        if ( tmp[1] ) {
          // console.log("tmp[1] ", tmp[1] );
          const newValue = tmp[1].split('/')[0];
          // console.log("newValue ", newValue );
          if ( newValue[0] ) {
            props.change('userData', newValue);
          }
        }
      }
    }
  }, [userData]);

  const nextDisabled = pristine || submitting || !platform || platform == '0' || !userData || fetchingProfileInfo;

  const prevDisabled = submitting;

  const onNextPage = useCallback(() => {
    console.log("mounted ", mounted);
    if ( !mounted ) {
      return;
    }
    nextPage();
  }, [mounted]);

  const onNext = useCallback(() => {
    if ( fetchingProfileInfo ) {
      console.error("Already fetching profile info");
      return;
    }

    if ( !platform || platform === '0' ) {
      console.error("Invalid platform.");
      return;
    }

    if ( !userData ) {
      console.error("No name");
      return;
    }

    setFetchingProfileInfo(true);
    setFetchingProfileName(userData);

    // With the template we dont need to fetch the data.
    if ( template ) {
      console.log("using template from extension. ", template);
      props.change('authorised', false);
      props.change('statementInfo', null);
      props.change('proof', null);
      props.change('proofData', null);
      props.change('profileInfo', {
        profileExists: true,
        profileInfo: {
          onlyUrl: false,
          name: template.name,
          profileImage: ['default', null].indexOf(template?.profilePicUrl ?? null) === -1 ? template?.profilePicUrl : 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh',
          backgroundImage: ['default', null].indexOf(template?.backgroundPicUrl ?? null) === -1 ? template?.backgroundPicUrl : 'https://static.licdn.com/sc/h/lortj0v1h4bx9wlwbdx6zs3f',
          country: null,
        },
      });
      (new Promise<void>(resolve => setTimeout(resolve, 1000))).then(() => {
        setFetchingProfileInfo(false);
        onNextPage();
      }).catch(console.error);

      return;
    }
    const uri = serviceUrl('/platform/profile-info', `p=${platform}&id=${userData}` );

    fetchHandler.execute(uri).then( ({json: result, mounted}) => {
        if (!mounted) {
          throw new Error('Not mounted');
        }

        if ( result?.error ) {
          console.error(result?.error);
          setFetchingProfileInfo(false);
          if ( result.error === 'Failed to fetch' ) {
            dispatch(error('Service currently not available'));
          } else {
            dispatch(error(result.error));
          }
          return;
        }

        const sessionId = result.id;
        if ( !sessionId ) {
          throw new Error('No available session id');
        }

        (async () => {
          let result: any | undefined = null;
          const uriUpdate = serviceUrl(`/platform/profile-info/${sessionId}/status`);

          const dt = new Date().getTime();
          while (!result?.status || result?.status === 'opening') {
            const {json, mounted} = await fetchHandler.execute(uriUpdate);
            result = json;
            console.log("Fetch mounted : " + mounted);
            if (!mounted) {
              throw new Error('Not mounted');
            }
            console.log("Polling profile status ", result);
            if ( (new Date().getTime()) - dt >= 120000 ) {
              throw new Error('Request timed out.');
            }
            if ( !result?.status || result?.status === 'opening' ) {
              await Timeout.set(1000);
            }
          }

          return result;
        })().then(result => {
          // console.log("Profile info result : ", result);
          if ( result.status === 'done' ) {
            // console.log("Profile data fetched ", result);
            if (result?.profileExists) {

              // Reset some variables in case the user naviated back to the first page.
              props.change('authorised', false);
              props.change('statementInfo', null);
              props.change('proof', null);
              props.change('proofData', null);
              props.change('profileInfo', result);

              // console.log("Next page!!");
              onNextPage();
            } else {
              setUserError('Invalid linkedin profile name ' + fetchingProfileName);
            }
            
          } else if ( result.status === 'error' ) {
            dispatch(error(result.error ?? "Error fetching profile info"));
            
          }

        }).catch(e => {
          if ( e?.message === "Not mounted" ) {
            throw e;
          }
          console.error("Error ", e);
          dispatch(error("Error fetching profile info"));
        }).finally(() => {
          setFetchingProfileInfo(false);
        });

    }).catch(({error: e, mounted}) => {
      console.error(e);
      if ( e?.message === "Not mounted" ) {
        return;
      }
      let errMsg = e?.message ?? 'Failed to verify infomation';
      if ( errMsg === 'Failed to fetch' ) {
        errMsg = 'Service is currently not available.';
      }
      dispatch(error(errMsg));
      setUserError('Failed to validate id.');
      setFetchingProfileInfo(false);
      console.error(e);
    }).finally(() => {
     // setFetchingProfileInfo(false);
    });
    
    // nextPage();
  }, [mounted, fetchingProfileInfo, platform, userData, props, template]);

  useEffect(() => {
    if ( hasSetValuesFromTemplate ) {
      onNext();
    }
  }, [hasSetValuesFromTemplate]);

  /*return (
    <Box sx={{background: 'black', color: 'white', display: 'flex', position: 'absolute' }}>
      <Box sx={{padding: 0.5, width: '380px', height: '150px' }}>
        <Typography variant="body1" color="inherit" component="p">
          Provide the Linked In User
        </Typography>
        <Box sx={{background: `url(${LinkedInUsernameHelpPng})`, width: '100%', height: '110px', backgroundSize: 'contain',  backgroundRepeat: 'no-repeat' }} />
      </Box>
    </Box>
  );*/

  const showInput = true; // !fetchingProfileInfo;

  const platformName = platform === 'li' ? 'LinkedIn' : '';

  return (
    <form onSubmit={nextPage}>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{display: 'flex', flexDirection: 'column', visibility: browserExtInstalled === null ? 'hidden' : 'initial'}}>
          {({width, height}: {width: number, height: number}) => (
            <>
              <Box sx={{display: 'flex', flexDirection: 'column', opacity: fetchingProfileInfo ? 0.05 : 1}}>
                <WizardRow name="Platform" desc="Select platform" tooltip={<Box sx={{padding: 1}}>Select the platform for the profile you want to issue a proof of verification</Box>} field={{
                  sx: {
                    marginLeft: '9px',
                  },
                  labelText: 'Platform',
                  name: 'platform',
                  disabled: hasSetValuesFromTemplate,
                  component: renderSelect,
                  placeholder: 'platform',
                  children: [
                    <MenuItem key="platform-opt-0" value={"0"} selected disabled hidden>Select social network...</MenuItem>,
                    ...supportedSocialNetworks.map(({displayName, id, icon}, index) => {
                      return (
                        <MenuItem
                          key={`platform-opt-${index + 1}`}
                          value={id}
                          disabled={index !== 1}
                          style={{
                            display: 'flex',
                          }}
                        >
                          <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                            {icon}
                            <ListItemText sx={{ ml: 0.5, mr: 6 }}>{displayName}</ListItemText>
                          </Box>
                        </MenuItem>
                      );
                    })
                  ]
                }} />

                <WizardRow sx={{marginTop: 1}} name={'Username'} tooltip={
                  <Box sx={{padding: 1, width: '360px', height: '180px' }}>
                    {platform === 'li' ? 
                    <>
                      <Typography variant="body1" color="inherit" component="p" width="330px">                      
                        You can find the {`${platformName}`} username by navigating to your LinkedIn profile and copy the name and number from the address.
                      </Typography>
                      <Box sx={{marginTop: 1, background: `url(${LinkedInUsernameHelpPng})`, width: '100%', height: '110px', backgroundSize: 'contain',  backgroundRepeat: 'no-repeat' }} />
                    </> :
                    <>
                      <Typography variant="body1" color="inherit" component="p" width="330px">                      
                        Provide us with your unique username of your social media profile.
                      </Typography>
                    </>}
                  </Box>
                }  desc={`Provide ${platformName} Username`} field={{
                    labelText: `${platformName} Username`,
                    name: 'userData',
                    disabled: hasSetValuesFromTemplate,
                    component: renderTextField,
                    type: 'text',
                    error: userError,
                }} />

              </Box>

              {
              fetchingProfileInfo ?
                <Box sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                  <WizardLoading title="Validating Profile" subtitle={`Validating ${platformName} profile.`} />        
                </Box>
                :
                undefined
              }
            </>
          )}
        </TrackBox>
      </InstallExtensions>

      <WizardNav sx={{marginTop: '32px',}} onPrev={handleBack} nextDisabled={nextDisabled} prev="Back" next="Next" onNext={onNext}/>
    </form>
  );
}));
