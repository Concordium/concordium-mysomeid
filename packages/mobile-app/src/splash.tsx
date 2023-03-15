import React, { Component } from "react";
import { Text, View } from "react-native";

import {styles} from './styles';

export class Splash extends Component {
  constructor(props: any) {
    super(props);

    setTimeout(() => {
      props.navigation.navigate("Home");
    }, 3000);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hello Splash</Text>
      </View>
    );
  }
}
