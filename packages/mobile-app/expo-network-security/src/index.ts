import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "@expo/config-plugins";

import {
  ExpoConfig
} from 'expo/config';

import {
  withAndroidPlugin
} from "./android";

let pkg: { name: string; version?: string } = {
  name: "expo-network-security",
  version: "UNVERSIONED",
};

const shareMenuPlugin: ConfigPlugin = createRunOncePlugin(
  (config: ExpoConfig) => {
    console.log("config ", config);
    return withPlugins(config, [
      withAndroidPlugin,
      // withIOSPlugin,
    ]);
  },
  pkg.name,
  pkg.version
);

export default shareMenuPlugin;
