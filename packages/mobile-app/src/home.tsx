import React from "react";
import {
  Text,
  View,
  Image,
  Dimensions,
} from "react-native";
import { useHeaderHeight } from '@react-navigation/elements';
import {
  LinearGradient
} from 'expo-linear-gradient';

import {
  routes
} from './routes';

import { 
  DebugClickable,
  Debug,
} from './debug'

import {
  BigButton
} from './big-button';
 
import VerifyProfileIcon from './icon-verify-profile';

import SecureIcon from './icon-secure';

import FAQIcon from './icon-faq';

const logoImg = require('./logo.png');

export const Home = ({navigation}: any) => {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

  const factor = 0.3;
  const w = windowWidth + Math.round(windowWidth * factor);

  const hdrHeight = useHeaderHeight();

  const clientHeight = windowHeight - hdrHeight;

  return (
    <View style={{
    }}>
      <LinearGradient 
        colors={['#FAFBFF', '#F6F7FD', '#C8CBDB']}
        locations={[0, 0.8, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: clientHeight + 5,
        }}
      >
        <DebugClickable>
          <View style={{
            flex: 1,
            alignItems: 'center',
            top: 50,
            height: 30,
            width: windowWidth,
            flexDirection: 'column',
          }}>
            <Image
              source={logoImg}
              style={{
                width: windowWidth / 3,
                height: windowWidth / 3,
                resizeMode: 'contain',
                marginTop: 5,
                overflow: 'visible',
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
                shadowOpacity: 0.25,
                shadowRadius: 13,
                elevation: 20,
              }}
            />
            <Text style={{
              fontSize: 34,
              color: '#2f354b',
              textAlign: 'center',
              fontFamily: 'DIN Alternate',
              marginTop: 5,

              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.2,
              shadowRadius: 7,
              elevation: 12,

              // backgroundColor: 'red'
            }}>MYSOME.ID</Text>
            <Text style={{
              fontSize: 14,
              marginTop: 5,
              color: '#2f354b',
              textAlign: 'center',
              fontFamily: 'DIN Alternate',

              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.2,
              shadowRadius: 7,
              elevation: 12,

              // backgroundColor: 'red'
            }}>Secure Your Online Presence</Text>
            
          </View>
        </DebugClickable>

        <View style={{
          position: 'absolute',

          // backgroundColor: 'red',
          width: windowWidth,
          height: clientHeight,
          // paddingBottom: '30%',
          flex: 1,
          padding: 10,
          justifyContent: 'flex-end',
          paddingBottom: 20,
          // alignItems: 'center',
        }}>
          <BigButton style={{marginTop: 0}} icon={<View style={{width: 41, height: 40, paddingLeft: 6, paddingTop: 5,}}><VerifyProfileIcon style={{scale: 0.75}}/></View>} title={'Verify Other Profile'} desc={'Scan or validate profiles with a MYSOME.id QR code embedded'} onPress={() => navigation.navigate(routes.validateOther)}/>
          <BigButton style={{marginTop: 15}} icon={<View style={{width: 41, height: 40, paddingLeft: 6, paddingTop: 4,}}><SecureIcon style={{scale: 0.8}}/></View>} title={'Secure My Profile'} desc={'Secure Your online presence by issuing a proof of ownership'} onPress={() => navigation.navigate(routes.secureOwn)} />
          <BigButton style={{marginTop: 15}} icon={<View style={{width: 41, height: 40, paddingLeft: 7, paddingTop: 7,}}><FAQIcon style={{scale: 0.75}}/></View>} title={'FAQ'} desc={'Learn about MYSOME.id and Concordium'} onPress={() => navigation.navigate(routes.faq)} />
        </View>

      </LinearGradient>
    </View>

  );
};

