import React, { Component, useState } from "react";
import {
  View,
} from "react-native";

import {
  Image
} from 'react-native'

import {
  styles
} from './styles';

// import image from './1673006091287.png';

export const Validate = () => {
  
  return (
    <View>
      <Image 
        source={require('./1673006091287.png')}  
        style={{width: 400, height: 400, borderRadius: 400/ 2}} 
      />
    </View>
  );
};

