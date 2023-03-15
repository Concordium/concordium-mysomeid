import React from "react";
import {
  Text,
  View,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import {
  defaultFont
} from './styles';

import {
  useHeaderHeight
} from '@react-navigation/elements';

export const Loading = ({loadingText,}: {loadingText: string}) => {
  const { height: windowHeight } = Dimensions.get('screen');
  const hdrHeight = useHeaderHeight();
  const clientHeight = windowHeight - hdrHeight;

  return (
    <View style={{width: '100%', height: clientHeight - (clientHeight / 2.33), justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
      <Text style={{width: '100%', textAlign: 'center', marginTop: 10, ...defaultFont}}>{loadingText}</Text>
    </View>
  ); 
}
