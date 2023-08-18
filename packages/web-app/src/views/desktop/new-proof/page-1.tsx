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
  reset,
} from 'redux-form';
import {
  WizardRow
} from 'src/components';
import {
  WizardLoading,
} from './wizard-loading';
import validate from './validate';
import {
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
} from './ui';
import formName, { selector } from './form-props';
import {
  useExtension
} from 'src/hooks/use-extension';
import { error } from 'src/slices/messages-slice';
import { TrackBox } from './track-box';
import {
  InstallExtensions
} from './install-extensions';
import {
  useTemplateStore
} from './template-store';
import { useAnalytics } from 'src/hooks/use-analytics';

export default connect(state => ({
  name: selector(state, 'name'),
  platform: selector(state, 'platform'),
  userId: selector(state, 'userId'),
  profileInfo: selector(state, 'profileInfo'),
}))(reduxForm({
  form: formName,
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
  initialValues: {
    platform: "0",
    userId: '',
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
  } = props;
  const {installed: browserExtInstalled, startRegistration} = useExtension();
  const [hasSetValuesFromTemplate, setHasSetValuesFromTemplate] = useState(false);
  const [fetchingProfileInfo, setFetchingProfileInfo] = useState<{ platform: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {lastLocation} = useLastLocation();
  const previousFailed = searchParams.get('previousFailed');
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.track({type: 'create-proof-step', options: {stepNumber: 1}});
  }, []);

  const {
    platform,
    userId,
    name,
  } = useTemplateStore(props, [ // copy from props.
    'platform',
    'name',
    'userId',
  ]);

  useEffect(() => {
    if (previousFailed !== null && previousFailed !== undefined) {
      navigate("/create/1");
      dispatch(error('Wizard restart'));
    }
  }, [previousFailed]);

  useEffect(() => {
    if (!mounted) {
      console.log('lastLocation?.pathname ', lastLocation?.pathname);
      if (['/', '/home'].indexOf(lastLocation?.pathname) >= 0) {
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

  const handleBack = useCallback(() => {
    dispatch(reset(formName));
    navigate('/home');
  }, []);

  const nextDisabled = pristine || submitting || !platform || (platform as string) == '0' || fetchingProfileInfo;
  const prevDisabled = submitting || !!fetchingProfileInfo;

  const onNextPage = useCallback(() => {
    if (!mounted) {
      return;
    }
    nextPage();
  }, [mounted]);

  const onNext = useCallback(() => {
    if (fetchingProfileInfo) {
      console.error("Already fetching profile info");
      return;
    }

    if (!platform || (platform as string) === '0') {
      console.error("Invalid platform.");
      return;
    }

    // If the userid and name is not set, we scrape it from LinkedIn.
    if ( !userId || !name ) {
      startRegistration({ platform });

      setFetchingProfileInfo({
        platform,
      });

      (new Promise<void>(resolve => setTimeout(resolve, 1000))).then(() => {
        window.setTimeout(() => {
          window.location.href = `https://linkedin.com`;
        });
      }).catch(console.error);

    } else {
      onNextPage();

    }
  }, [mounted, fetchingProfileInfo, platform, userId, name, props]);

  useEffect(() => {
    if (hasSetValuesFromTemplate) {
      onNext();
    }
  }, [hasSetValuesFromTemplate]);

  const platformNameReadable = platform === 'li' ? 'LinkedIn' : '';

  return (
    <form onSubmit={nextPage}>
      <InstallExtensions>
        <TrackBox id="container-box" sx={{ display: 'flex', flexDirection: 'column', visibility: browserExtInstalled === null ? 'hidden' : 'initial' }}>
          {({ width, height }: { width: number, height: number }) => (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', opacity: fetchingProfileInfo ? 0.05 : 1 }}>
                <WizardRow name="Platform" desc="Select platform" tooltip={<Box sx={{ padding: 1 }}>Select the platform for the profile you want to issue a proof of verification</Box>} field={{
                  sx: {
                    marginLeft: '9px',
                  },
                  labelText: 'Platform',
                  name: 'platform',
                  component: renderSelect,
                  placeholder: 'platform',
                  children: [
                    <MenuItem key="platform-opt-0" value={"0"} selected disabled hidden>Select social network...</MenuItem>,
                    ...supportedSocialNetworks.map(({ displayName, id, icon }, index) => {
                      return (
                        <MenuItem
                          key={`platform-opt-${index + 1}`}
                          value={id}
                          disabled={index !== 1}
                          style={{
                            display: 'flex',
                          }}
                        >
                          <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            {icon}
                            <ListItemText sx={{ ml: 0.5, mr: 6 }}>{displayName}</ListItemText>
                          </Box>
                        </MenuItem>
                      );
                    })
                  ]
                }} />
              </Box>

              {
                fetchingProfileInfo ?
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', position: 'absolute', width: `${width}px`, height: `${height}px` }}>
                    <WizardLoading title="Validating Profile" subtitle={`Opening ${platformNameReadable} Profile`} />
                  </Box>
                  :
                  undefined
              }
            </>
          )}
        </TrackBox>
      </InstallExtensions>

      <WizardNav sx={{ marginTop: '32px', }} onPrev={handleBack} prevDisabled={prevDisabled} nextDisabled={nextDisabled} prev="Back" next="Next" onNext={onNext} />
    </form>
  );
}));
