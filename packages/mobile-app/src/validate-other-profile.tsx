import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  Dimensions,
  Alert,
} from "react-native";
import {
  useHeaderHeight
} from '@react-navigation/elements';
import {
  ScanQR 
} from './scan-qr';
import {
  LinearGradient
} from 'expo-linear-gradient';
import {
  BigButton
} from './big-button';
import ScanQRIcon from './icon-scan-qr';
import ShareIcon from './icon-share';
import {
  Loading
} from './loading';
import {
  parseMySoMeProofUrl,
  alertDelay,
} from './utils';
import {
  defaultFont
} from './styles';
import {
  routes
} from "./routes";
import {
  ProfileInfoData,
  ProofOracleValidationData,
  useAPI
} from './api';

import {
  Certificate
} from './certificate';
import { useTheme } from "./theme";
import { useIntent } from "./intent";
import { trimString } from "./trim-string";
import { useNavigationController } from "./navigation-controller";

export const ValidateOtherProfile = ({navigation}: any) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const [showAppOptions, setShowAppOptions] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');
  const [showCertificate, setShowCertificate] = useState<ProofOracleValidationData | null>(null);

  const appNavigation = useNavigationController();

  const intent = useIntent();

  const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

  const factor = 0.3;
  const w = windowWidth + Math.round(windowWidth * factor);

  const hdrHeight = useHeaderHeight();

  const clientHeight = windowHeight - hdrHeight;

  const api = useAPI();

  const theme = useTheme();

  const showScanner = useCallback(() => {
    setIsModalVisible(true);

  }, []);

  const processScannedUrl = useCallback((url: string) => {
    console.log("Process scanned URL: ", url);
    setLoading(true);
    setShowCertificate(null);
    appNavigation.setBackDisabled(true);
    setLoadingText('Validating proof\n(Can take up to 2 minutes)');
    api.getValidationFromProfileUrlWithOracle(url).then( (proofData: ProofOracleValidationData) => {
      console.log("Proof data received: ", proofData);
      if ( !proofData ) {
        alertDelay('Proof is invalid', 250);
        return;
      }
      if ( proofData.error ) {
        proofData.reason = 'Proof is invalid';
        proofData.valid = false;
        setShowCertificate(proofData); // show the certificate
        return;
      }
      setShowCertificate(proofData); // show the certificate

    }).catch((e: any) => {
      console.error(e?.message ?? 'Unknown');
      alertDelay('Connection failed\n\nPlease try again later', 250);

    }).finally(() => {
      setLoading(false);
      appNavigation.setBackDisabled(false);

    });
  }, []);

  /*useEffect(() => {
    if ( !loading ) {
      return;
    }
    appNavigation.setOnIgnoreBackCb((e: any) => {
      Alert.alert(
        'Discard validation?',
        'Are you you want cancel the validation?',
        [
          { text: "Stop", style: 'cancel', onPress: () => {} },
          {
            text: 'Cancel',
            style: 'destructive',
            // If the user confirmed, then we dispatch the action we blocked earlier
            // This will continue the action that had triggered the removal of the screen
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return () => {
      appNavigation.setOnIgnoreBackCb(null);
    }
  }, [appNavigation, loading]);*/

  const intentUrl = intent.getCurrentUrlToValidate();
  console.log("intentUrl ", intentUrl);
  useEffect(() => {
    if ( !intentUrl ) {
      return;
    }

    intent.setCurrentUrlToValidateProcessed();
        
    const comps = trimString(intentUrl, '/').split('/');
    const userData = comps[comps.length - 1];

    if ( !userData ) {
      alertDelay('Connection failed\n\nPlease try again later', 250);
      return;
    }

    setShowCertificate(null);
    setLoading(true);
    appNavigation.setBackDisabled(true);
    setLoadingText('Locating profile data\n(Can take up to 2 minutes)');
    api.getProfileInfoByUrlWithOracle(intentUrl).then((profileData: ProfileInfoData) => {
      console.log("QR code is received.");
      if ( !profileData ) {
        alertDelay('Proof is invalid', 250);
        return null
      }

      return profileData;
    }).then((profileData: any) => {
      if ( !profileData || profileData.status === 'error' ) {
        return {
          profileData: null,
          qrData: null
        };
      }

      setLoadingText('Locating proof in profile\n(Can take up to 2 minutes)');

      const imageUrls = [profileData.profileInfo.backgroundImage ?? '', profileData.profileInfo.profileImage ?? ''].filter(x => !!x);
      return api.getQRCodeOfUrlsByUrlWithOracle(imageUrls)
        .then((result: string | null) => {
          if ( !result ) {
            console.log("No QR code in image(s)");
          }
          return {
            profileData: profileData,
            qrData: result
          };
        });

    }).then(({profileData, qrData}: {profileData: ProfileInfoData | null, qrData: string | null}) => {
      const validationFailedData: ProofOracleValidationData = {
        error: undefined,
        data: {},
        platform: 'li',
        userData: '',
        firstName: '',
        surName: '',
        country: '',
        platformUri: '',
        profilePicUri: '',
        revoked: false,
        valid: false,
        date: 0,
      };

      if ( !profileData ) {
        return 'Profile not found, please try again';
      }
      
      const name = (profileData?.profileInfo?.name ?? '').replace(/\s+/g, ' ').trim();
      const nameComps = name.split(' ');
      const firstName = nameComps[0] ?? '';
      const lastName = nameComps[nameComps.length - 1] ?? '';
      
      const urlComps = trimString(intentUrl, '/').split('/');
      const userData = urlComps[urlComps.length - 1];

      if (!userData) {
        return 'No user data in URL';
      } 

      validationFailedData.platformUri = profileData.url;
      validationFailedData.firstName = firstName;
      validationFailedData.surName = lastName;
      validationFailedData.profilePicUri = profileData.profileInfo?.profileImage ?? '';

      if ( !qrData ) {
        console.log("No QR data avilable");
        validationFailedData.reason = 'No QR code available';
        return validationFailedData;
      }

      const comps = qrData.split('/');
      const proofId = comps[comps.length - 1];

      if ( !proofId ) {
        console.error('No proof id in string ' + qrData);
        validationFailedData.reason = 'No Proof available';
        return validationFailedData;
      }

      setLoadingText('Validating proof\n(Can take up to 2 minutes)');      
      
      return api.getValidationFromUserDataWithOracle({
        proofId,
        proofUrl: qrData,
        platform: 'li',
        firstName,
        lastName,
        userData,
      }).then( (validationData: ProofOracleValidationData) => {
        console.log("Proof is ready to go.", validationData);
        if ( !validationData || validationData?.error ) {
          validationFailedData.reason = 'Failed to verify proof';
          return validationFailedData;
        }
        return validationData;
      });

    }).then((result: ProofOracleValidationData | string) => {
      console.log("Final result", result);
      if ( typeof result === 'string' ) {
        alertDelay(result, 250);
      } else {
        setShowCertificate(result); // show the certificate
      }

    }).catch((e: Error) => {
      console.error("error ", e);
      alertDelay('Connection failed\n\nPlease try again later', 250);
    }).finally(() => {
      console.log('Result');
      setLoading(false);
      appNavigation.setBackDisabled(false);
    });

  }, [intentUrl]);

  const onScannerResult = useCallback(({type, data, cancelled, error}: {type?: string, data?: string, cancelled?: boolean, error?: string}) => {
    setIsModalVisible(false);

    // console.log({type, data, cancelled, error});
    if ( data && type ) {
      if ( type.toLowerCase().indexOf('qr') >= 0 && data && data.length > 0 ) {
        try {
          const {
            error,
            id: proofId,
          } = parseMySoMeProofUrl(data);

          const generalErr = 'The QR scanned is not a MYSOME proof';

          if ( error ) {
            alertDelay(`${generalErr}\n\n${error}`, 500);
            return;
          }

          if ( !proofId ) {
            alertDelay(generalErr, 500);
            return;
          }

          processScannedUrl(data);

        } catch(e) {
          console.error(e);
          alertDelay('The QR code is not a MYSOME code and the account cannot be verified', 500);
        }

      }

    } else if ( cancelled ) {
      // Do nothing its cancelled.

    } else {
      alertDelay('Unknown error\n\nPlease try again', 500);

    }
  }, []);

  if ( showCertificate ) {
    return <Certificate {...{proofData: showCertificate}} />;
  }

  if ( loading ) {
    return <Loading {...{loadingText}} />;
  }

  return (
    <View style={{
      width: '100%',
      height: clientHeight - (clientHeight / 2.33),
      justifyContent: 'center'
    }}>
      <LinearGradient 
        colors={['#FAFBFF', '#F6F7FD', '#C8CBDB']}
        locations={[0, 0.8, 1]}
        style={{
          position: 'absolute',
          paddingLeft: 10,
          paddingRight: 10,
          left: 0,
          right: 0,
          top: 0,
          height: clientHeight + 5,
          display: 'flex',
        }}
      >

        <View>
          <Text style={{...defaultFont, fontFamily: theme.fontFamily, textAlign: 'center', color: '#383838', fontSize: 20, letterSpacing: 0.5, margin: 15, marginTop: 30, marginBottom: 0}}>
            Verify Social Media Profiles{'\n'}with a MYSOME QR Code.
          </Text>

          <Text style={{...defaultFont, fontFamily: theme.fontFamily, color: '#383838', fontSize: 14, letterSpacing: 0.5, margin: 15, marginTop: 30, marginBottom: 0}}>
            Use the app to check the QR code embedded in a social media account belongs to a real person who are who they claim to be.
          </Text>

          <View style={{
            position: 'absolute',
            width: '100%',
            height: clientHeight,
            flex: 1,
            padding: 10,
            justifyContent: 'flex-end',
            paddingBottom: clientHeight * 0.05,
          }}>
            <Text style={{fontFamily: theme.fontFamily, color: '#383838', letterSpacing: 0.5, fontSize: 14,}}>
              You have two options to verify a profile;
            </Text>

            <BigButton
              style={{marginTop: 15}}
              icon={<View style={{width: 41, height: 40, paddingLeft: 7, paddingTop: 2,}}>{<ScanQRIcon style={{scale: 0.75}}/>}</View>}
              title={'Scan QR Code On Profile'}
              noChevron
              desc={'Use the camera to scan a QR code embedded in a profile'}
              onPress={() => showScanner()}/>

            <BigButton
              style={{marginTop: 20}}
              icon={<View style={{width: 41, height: 40, paddingLeft: 9, paddingTop: 4,}}><ShareIcon style={{scale: 0.75}}/></View>}
              title={'Share Profile Page'}
              desc={'Share the profile page with the MYSOME App'}
              onPress={() => navigation.navigate(routes.helpShareProfile) }/>
          </View>

        </View>
        <ScanQR isVisible={isModalVisible} onCloseWithResult={onScannerResult} />

      </LinearGradient>
    </View>
  );
};

