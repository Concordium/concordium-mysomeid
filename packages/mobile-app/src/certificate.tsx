import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  Image,
  Dimensions,
} from "react-native";

import ShieldGreenIcon from './icon-green-shield';
import ShieldYellowIcon from './icon-yellow-shield';
import ShieldRedIcon from './icon-red-shield';

import LinkedInIcon from './icon-linkedin';

import {
  useHeaderHeight
} from '@react-navigation/elements';

import {
  profileStatusTexts,
  colors,
} from './constants';
import { LinearGradient } from "expo-linear-gradient";
import { ProofOracleValidationData } from "./api";
import { defaultFont } from "./styles";

const qrIcon = require('./icon-qr.png');
const ghostProfilePic = require('./profile-pic-ghost.png');

export const Certificate = ({proofData}: {proofData: ProofOracleValidationData}) => {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

  const factor = -0.08;
  const w = windowWidth + Math.round(windowWidth * factor);

  const hdrHeight = useHeaderHeight();

  const clientHeight = windowHeight - hdrHeight + 5;

  const unsetValue = 'xxxxxxxx';
  const firstName = proofData.firstName ?? unsetValue;
  const surName = proofData.surName ?? unsetValue;
  const country = proofData.country ?? unsetValue;
  const profileUrl = proofData.platformUri ?? 'http://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const [profilePicUri, setProfilePicUri] = useState<string | null>(proofData.profilePicUri ?? null);
  const [profilePic, setProfilePic] = useState<string | ArrayBuffer | null>(null);
  const [gettingProfilePic, setGettingProfilePic] = useState(false);

  let proofStatus: 'valid' | 'warning' | 'error' = 'warning'; // 'warning';
  if (proofData.valid) {
    proofStatus = 'valid';
  } else {
    proofStatus = 'error';
  }
  let proofStatusText = profileStatusTexts[proofStatus];
  if ( proofStatus !== 'valid' && proofData.reason) {
    proofStatusText = proofData.reason;
  }
  const ntfColor = colors[proofStatus];
  const Shield = (proofStatus as string) === 'valid' ? ShieldGreenIcon :
                  (proofStatus as string) === 'warning' ? ShieldYellowIcon :
                    ShieldRedIcon;

  useEffect(() => {
    return () => {
      console.log("view unmounted!");
    };
  }, []);

  const fs = 16;
  useEffect(() => {
    if (!profilePicUri) {
      console.log("No profile pic uri");
      return;
    }
    if (profilePic) {
      console.log("Already fetched a profile pic.");
      return;
    }
    if (gettingProfilePic) {
      console.log("Already getting profile pic");
      return;
    }
    setGettingProfilePic(true);
    console.log("Getting profile picture at uri " + profilePicUri);
    fetch(profilePicUri)
      .then(response => response.blob())
      .then(blob => {
        console.log("Got profile pic : ", blob.type );
        const allowedFileTypes = ["image/png", "image/jpeg", "image/gif"];
        if ( allowedFileTypes.indexOf(blob.type.toLowerCase() ) === -1 ) {
          setProfilePic(null);
          setProfilePicUri(null);
          return;
        }
        const fr = new FileReader();
        let done = false;
        fr.onload = () => {
          if ( done ) {
            return;
          }
          setProfilePic( fr.result );
          setProfilePicUri(null);
          done = true;
        };
        fr.readAsDataURL(blob); 
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setGettingProfilePic(false);
      });
  }, [profilePicUri, profilePic, gettingProfilePic]);

  return (
    <View style={{width: '100%', height: clientHeight - (clientHeight / 2.33), justifyContent: 'center'}}>
      <LinearGradient 
        colors={['#FAFBFF', '#F6F7FD', '#C8CBDB']}
        locations={[0, 0.8, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: clientHeight,
          display: 'flex', 
        }}
      >
        <View style={{position: 'absolute', top: 0, left: 0, zIndex: 999, right: 0, display: 'flex', backgroundColor: ntfColor, opacity: 0.8, flexDirection: 'row', height: 56}}>
          <View style={{width: 56, height: 56, paddingTop: 5, paddingLeft: 5 }}>
            <LinkedInIcon style={{scale: 0.85}}/>
          </View>
          <View style={{width: '100%', height: 26, display: 'flex', flex: 1}}>
            <Text style={{...defaultFont, fontFamily: 'DIN Alternate', letterSpacing: 1.35, fontSize: 17, color: '#383838', margin: 5, marginBottom: 0, textAlign: 'center'}}>
              Status of Account
            </Text>
            <Text style={{...defaultFont, fontFamily: 'DIN Alternate', letterSpacing: 1.35, fontSize: 17, color: '#383838', margin: 5, marginBottom: 0, textAlign: 'center'}}>
              {proofStatusText}
            </Text>
          </View>
          <View style={{width: 56, height: 56, display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
            <Image source={qrIcon} />
          </View>
        </View>

        <Image 
          source={profilePic ? {uri: profilePic} : ghostProfilePic}
          style={{
            position: 'absolute',
            top: -Math.round(windowWidth * factor),
            left: -Math.round(windowWidth * factor / 2),
            marginTop: 48,
            width: w,
            height: w,
            borderRadius: w / 2,
            resizeMode: 'contain',
          }}
        />

        <View style={{
          position: 'absolute',
          top: 48 + w - 40,
          right: 40,
          width: 50,
          height: 50,
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.25,
          shadowRadius: 13,
          elevation: 20,
        }}>
          <Shield />
        </View>

        <View style={{position: 'absolute', display: 'flex', width: '100%', top: 48 + w + 40, height: clientHeight - 400}}>
          <View>
            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 16, width: '100%'}}>
              <Text style={{fontFamily: 'DIN Alternate', color: '#383838', width: '50%', fontSize: fs + 2, letterSpacing: 1.35, textAlign: 'center'}}>First name</Text>
            </View>
            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%'}}>
              <Text style={{fontFamily: 'DIN Alternate', color: '#383838', textAlign: 'center', width: '50%', fontSize: fs+5, letterSpacing: 1.35, paddingLeft: 5}}>{firstName}</Text>
            </View>

            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 16, width: '100%'}}>
              <Text style={{fontFamily: 'DIN Alternate', color: '#383838', width: '50%', fontSize: fs + 2, letterSpacing: 1.35, textAlign: 'center', }}>Last name</Text>
            </View>
            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%'}}>
              <Text style={{fontFamily: 'DIN Alternate', color: '#383838', textAlign: 'center', width: '50%', fontSize: fs+5, letterSpacing: 1.35, paddingLeft: 5}}>{surName}</Text>
            </View>
          </View>

          <Text style={{fontFamily: 'DIN Alternate', color: '#383838', width: '100%', fontSize: 14, textAlign: 'center', marginTop: 24, paddingRight: 5}}>{profileUrl}</Text>
        </View>
      </LinearGradient>
    </View>
  );  
}
