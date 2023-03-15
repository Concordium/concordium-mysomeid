import React from "react";
import {
  Text,
  // View,
  // Image,
  TouchableOpacity,
  // Dimensions,
} from "react-native";

// import { useHeaderHeight } from '@react-navigation/elements';

import {
  styles
} from './styles';

export const SecondaryButton = ({children, onPress}: any) => {
  return (
    <TouchableOpacity
      onPress={onPress ?? null}
      style={{
        padding: 10,
        borderRadius: Math.round(56 / 2),
        height: 56,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white', // 'rgba(0,0,0,0.1)',
        borderColor: 'black',
        borderWidth: 2,
      }}
    >
      <Text>{children}</Text>
    </TouchableOpacity>    
  );
}

