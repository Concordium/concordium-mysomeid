import React, { Component, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
  StatusBar,
  TextInput,
  SafeAreaView,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView
} from "react-native";

import {
  styles
} from './styles';

/*export const Home = ({navigation}: {navigation: any}) => {

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <TouchableWithoutFeedback
            style={styles.container}
            onPress={Keyboard.dismiss}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.title}>Account Information</Text>
              </View>

              <View style={styles.infoContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter User name/Email"
                  placeholderTextColor="rgba(255,255,255,0.8)"
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCorrect={false}
                  onSubmitEditing={() => this.refs.txtPassword.focus()}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter Password"
                  placeholderTextColor="rgba(255,255,255,0.8)"
                  returnKeyType="go"
                  autoCorrect={false}
                  ref={"textPassword"}
                />

                <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate("Splash")}>
                  <Text style={styles.buttonText}>SIGN IN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}*/

export const Home: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={text => setUsername(text)}
            style={{
              height: 40,
              width: '80%',
              borderColor: 'gray',
              borderWidth: 1,
              marginVertical: 10,
              paddingHorizontal: 10,
            }}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={text => setPassword(text)}
            style={{
              height: 40,
              width: '80%',
              borderColor: 'gray',
              borderWidth: 1,
              marginVertical: 10,
              paddingHorizontal: 10,
            }}
          />
          <TouchableOpacity
            onPress={() => console.log('Login Button Pressed')}
            style={{
              backgroundColor: 'lightgray',
              padding: 10,
              borderRadius: 5,
            }}
          >
            <Text>Login</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

