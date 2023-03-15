import React, { useState, useEffect, useCallback } from 'react';
import { NativeModules, DeviceEventEmitter, AppState, AppStateStatus, Button } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator
} from '@react-navigation/native-stack';
import {
  useFonts
} from 'expo-font';
import {
  Home
} from './home';
import {
  ValidateOtherProfile
} from './validate-other-profile';
import {
  SecureYourProfile
} from './secure-your-profile';
import {
  HelpShareProfile
} from './help-share-profile';
import {
  FAQ
} from './faq';
import {
  APIProvider
} from './api';
import {
  ThemeProvider
} from './theme';
import {
  routes
} from './routes';
import {
  IntentProvider
} from './intent';
// import { styles } from './styles';
import { Debug, DebugClickable } from './debug';
import { AppStateProvider } from './app-state';
import { NavigationController } from './navigation-controller';

const Stack = createNativeStackNavigator();

const MyTheme = {
  dark: false,
  colors: {
    primary: 'rgb(255, 45, 85)',
    background: '#FFFFFF',
    card: '#1F2348',
    text: '#FFFFFF',
    border: 'rgb(199, 199, 204)',
    notification: 'rgb(255, 69, 58)',
  },
};

const headerOptions = (title: string): any => ({
  title,
  headerStyle: {
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
    fontFamily: 'DIN Alternate',
  },
});
 
export function App() {  
  const [fontsLoaded] = useFonts({
    'Abel-Regular': require('./assets/fonts/Abel-Regular.ttf'),
    'ClearSans-Regular': require('./assets/fonts/ClearSans-Regular.ttf'),
    'ClearSans-Bold': require('./assets/fonts/ClearSans-Bold.ttf'),
  });

  return (
    <AppStateProvider>
      <IntentProvider>
        <ThemeProvider>
          <APIProvider>
            <NavigationContainer theme={MyTheme}>
              <NavigationController>
                <>
                <StatusBar
                  barStyle="light-content"
                  hidden={false}
                />
                <Stack.Navigator initialRouteName="MYSOME.ID" screenOptions={{
                  headerBackTitle: '',
                  headerStyle: {
                    shadowOpacity: 0.5,
                    shadowRadius: 2,
                    shadowColor: 'gray',
                    shadowOffset: { height: 2, width: 0 },
                    elevation: 2,
                  },
                }}  >
                  <Stack.Screen name={routes.home} component={Home} options={{
                    title: 'MYSOME.ID',
                    headerStyle: {},
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                      fontFamily: 'DIN Alternate',
                    },
                    headerRight: () => <DebugClickable />,
                  }}/>
                  <Stack.Screen name={routes.validateOther} options={headerOptions('Verify Other Profile')} component={ValidateOtherProfile} />
                  <Stack.Screen name={routes.secureOwn} options={headerOptions('Secure Own Profile')} component={SecureYourProfile} ></Stack.Screen>
                  <Stack.Screen name={routes.faq} options={headerOptions('FAQ')} component={FAQ} />
                  <Stack.Screen name={routes.helpShareProfile} options={headerOptions('FAQ')} component={HelpShareProfile} />
                  <Stack.Screen name={routes.debug} options={headerOptions('Debug')} component={Debug} />

                </Stack.Navigator>
                </>
              </NavigationController>
            </NavigationContainer>
          </APIProvider>
        </ThemeProvider>
      </IntentProvider>
    </AppStateProvider>
  );
}

export default App;
