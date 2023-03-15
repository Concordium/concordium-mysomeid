import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {View, Text, Dimensions, LogBox, ScrollView} from "react-native";

import {
  useHeaderHeight
} from '@react-navigation/elements';

export const Question = ({marginTop: marginTop = 32, title, children}: {title: string, children?: any, marginTop?: number}) => (
  <View style={{minHeight: 40, marginTop}}>
    <Text style={{fontSize: 24}}>{title}</Text>
    <Text style={{fontSize: 16, marginTop: 8}}>{children}</Text>
  </View>
);

export const FAQ = ({}) => {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

  const factor = 0.3;
  const w = windowWidth + Math.round(windowWidth * factor);

  const hdrHeight = useHeaderHeight();

  const clientHeight = windowHeight - hdrHeight;

  return (
    <View>
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
          <Question marginTop={40} title="What is mySoMe?" >
            MySoMe is a decentralised identity protocol that allows you to self-issue a proof of ownership of your social media profiles using your Concordium identity.
          </Question>

          <Question title="What is Concordium?" >
            Concordium is a smart contract enabled identity centric blockchain allowing your self custody of your identity.
            It achieves this using Zero Knowledge Proofs allowing you to maintain privacy.
          </Question>

          <Question title="How do I get started?" >
            Verify your existing social media profile by going to app.mysome.id and start the process to register yourself.
            {'\n'}
            TIP: Beforehand you must install the Concordium wallet. 
          </Question>

          <Question title="How do I verify a profile?" >
            If you see a social media profile with an embedded mySoMe QR code, you can scan the code with your mobile
            phone and the app will show the validity of the QR code.{'\n\n'}
            If you see a profile on your mobile you can futhermore share the profile with the mySoMe app to verify it.
            {'\n\n'}
            When browsing the internet on your laptop or PC using Chrome, Brave or Opera you can use the mySoMe extension to
            validate if a profile is valid.
            {'\n\n'}
          </Question>
        </ScrollView>
        
      </LinearGradient>
    </View>
  );
};