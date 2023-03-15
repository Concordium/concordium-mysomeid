import {
  ConfigPlugin
} from '@expo/config-plugins';

import {
  withAppEntitlements,
} from './withAppEntitlements';

import {
  withShareExtensionConfig,
} from './withShareExtensionConfig';

import {
  withShareExtensionXcodeTarget
} from "./withShareExtensionXcodeTarget";

export const withIOSPlugin: ConfigPlugin = (config) => 
  withAppEntitlements(
    withShareExtensionConfig(
      withShareExtensionXcodeTarget(config)
    )
  );
  