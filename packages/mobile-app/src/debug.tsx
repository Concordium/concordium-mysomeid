import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Button,
} from "react-native";
import {
  useHeaderHeight
} from '@react-navigation/elements';
import {
  BigButton
} from "./big-button";
import {
  setNextAPIBaseUrl,
  getAPIBaseUrl
} from './config';
import { useNavigation } from "@react-navigation/native";

export const DebugClickable = ({children}: any) => {
  let [lastClickTime, setLastClickTime] = useState(0);
  let [clickCount, setClickCount] = useState(0);
  const nav = useNavigation();

  const handleButtonClick = useCallback(() => {
    console.log("Debug clickable #" + clickCount);
    const now = Date.now(); // get the current time
    // check if this is the first click or if it's been more than a second since the last click
    if ( now - lastClickTime > 1000) {
      setClickCount(1); // reset the click count
    } else {
      setClickCount(clickCount + 1); // increment the click count
      if (clickCount === 4) {
        console.log("show debug");
        (nav as any).navigate('debug');
        setClickCount(0); // reset the click count
      }
    }
    setLastClickTime(now); 
  }, [clickCount, lastClickTime]);

  if ( !children ) {
    return <Button {...{onPress: handleButtonClick, children}}
      onPress={handleButtonClick}
      title="       "
    />;
  }

  return <TouchableWithoutFeedback {...{onPress: handleButtonClick, children}} />;
};

export const Debug = ({navigation}: any) => {
  const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

  const factor = 0.3;
  const w = windowWidth + Math.round(windowWidth * factor);

  const hdrHeight = useHeaderHeight();

  const clientHeight = windowHeight - hdrHeight;
  
  const [baseUrl, setBaseUrl] = useState(getAPIBaseUrl());

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
          height: clientHeight,
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
          <BigButton title="environment" desc={process.env.NODE_ENV ?? 'undefined'} noChevron={true} />
          <BigButton onPress={() => setBaseUrl(setNextAPIBaseUrl())} title="API base url" desc={baseUrl} noChevron={false} />
        </ScrollView>
        
      </LinearGradient>
    </View>
  );
};
