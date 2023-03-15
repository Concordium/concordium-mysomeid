import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
} from "react-native";

import ChevronIcon from './icon-chevron';

export const BigButton = (args: any) => {
  const {style, icon, title, desc, onPress} = args;
  const shadowOffsetWidth = 0;
  const shadowOffsetHeight = 6;
  const shadowOpacity = 7 / 100;
  const shadowRadius = 6;
  const noChevron = args.noChevron === true || (args.hasOwnProperty('noChevron') && args.noChevron !== false);
 
  return (
    <TouchableOpacity
      onPress={onPress ?? null}
      style={{
        // marginTop: 20,
        padding: 10,
        borderRadius: 8,
        height: 75,
        alignItems: 'center',
        // justifyContent: 'center',
        backgroundColor: 'white', // 'rgba(0,0,0,0.1)',
        // borderColor: 'black',
        // borderWidth: 2,
        shadowOffset: {
          width: shadowOffsetWidth,
          height: shadowOffsetHeight,
        },
        shadowOpacity,
        shadowRadius,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        ...style,
      }}
    >
      {icon}

      <View style={{
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 10,
        width: '75%',
        flex: 1,
        paddingRight: 10,
      }}>
        <Text style={{
          fontFamily: 'DIN Alternate',
          color: '#1E2354',
          fontSize: 14,
        }}>{title}</Text>
        <Text style={{
          fontFamily: 'DIN Alternate',
          color: '#A6ABBF',
          fontSize: 12,
        }}>{desc}</Text>
      </View>

      <View style={{
        // backgroundColor: 'red',
        width: 11,
        height: 25,
        marginLeft: 5,
        marginRight: 5,
      }}>
        {!noChevron ? <ChevronIcon /> : undefined}
      </View>

    </TouchableOpacity>    
  );
}
