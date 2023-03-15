import 'expo/build/Expo.fx';
import {
  AppRegistry,
  Platform
} from 'react-native';

import {
  withDevTools
} from 'expo/build/launch/withDevTools';

import App from './src/app';

import {
  createRoot
} from "react-dom/client";

// import registerRootComponent from 'expo/build/launch/registerRootComponent';
// registerRootComponent(App);

AppRegistry.registerComponent('main', () => withDevTools(App));
if (Platform.OS === 'web') {
  const rootTag = createRoot(document.getElementById('root') ?? document.getElementById('main'));
  const RootComponent = withDevTools(App);
  rootTag.render(<RootComponent />);
}
