import fs from 'fs';
import path from 'path';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";
// import { ManifestActivity } from '@expo/config-plugins/build/android/Manifest';

const codeNetworkSecurity = () => `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config>
    <domain-config cleartextTrafficPermitted="true">
      <domain includeSubdomains="true">127.0.0.1</domain>
      <domain includeSubdomains="true">10.0.0.1</domain>
      <domain includeSubdomains="true">10.0.1.1</domain>
      <domain includeSubdomains="true">10.0.2.2</domain>
      <domain includeSubdomains="true">localhost</domain>
    </domain-config>
    <domain includeSubdomains="true">mysomeid.dev</domain>
    <domain includeSubdomains="true">mysome.id</domain>
    <trust-anchors>
      <certificates src="user"/>
      <certificates src="system"/>
    </trust-anchors>
  </domain-config>
</network-security-config>
\n`;

export const withAndroidPlugin: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, config => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    let packageName: string | null = config.android?.package ?? null;
    const platformProjectRoot = config.modRequest.platformProjectRoot;

    mainApplication.$ = {
      ...(mainApplication?.$ ?? {}),
      'android:networkSecurityConfig': '@xml/network_security_config',
    };

    const dir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    try {
      fs.mkdirSync(dir, {});
    } catch(e) {
      if (e.message?.indexOf('already exists') === -1 ) {
        console.error(e);
        throw e;
      }
    }

    const fnNetworkSecCfgXml = path.join(dir, 'network_security_config.xml');
    console.log("Creating file : " + fnNetworkSecCfgXml);
    fs.writeFileSync(fnNetworkSecCfgXml, codeNetworkSecurity());

    return config;
  });

  return config;
};
