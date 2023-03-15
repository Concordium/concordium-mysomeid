import {
  LinearGradient
} from "expo-linear-gradient";
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

export const HelpShareProfile = ({}) => {
  const {
    width: windowWidth,
    height: windowHeight,
  } = Dimensions.get('screen');

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
          <Question marginTop={40} title="Share a profile" >
            Validate a profile on your mobile by scanning it or sharing it with the mySoMe app. 
            {'\n\n'}
          </Question>
        </ScrollView>
        
      </LinearGradient>
    </View>
  );
};