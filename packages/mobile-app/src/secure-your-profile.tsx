import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  View,
  Dimensions,
  ScrollView
} from "react-native";

import {
  useHeaderHeight
} from '@react-navigation/elements';

import {
  Question
} from './faq';

export const SecureYourProfile = ({navigation}: any) => {
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
          overflow: 'scroll',
          height: clientHeight + 5,
          display: 'flex',
        }}
      >
        <ScrollView style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
        }}>
          <Question marginTop={40} title="Secure your profile" >
            Secure your own profile(s) by issuing a self soverign proof of account ownership.
            {'\n\n'}
            The proof of ownership will ensure other people that you are who you claim to be and prevents fake profiles to pretend they are you.
            {'\n\n'}
            A self-soverign identity means that you yourself have custody over your identity. 
            {'\n\n'}
            When you issue a proof of account ownership you will receive a soul bound NFT which is owned by yourself.
            {'\n\n'}
            In case your social media profile is compromised you can revoke the validity of your proofs at and given time in order to issue a new proof.
          </Question>
        </ScrollView>
        
      </LinearGradient>
    </View>
  );
};
