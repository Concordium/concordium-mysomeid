type MilestoneItem = {
  title?: string;
  desc?: string;
};

type RoadmapMilestone = {
  date: string;
  title?: string;
  items: MilestoneItem[];
};

type TokenomicsInfo = {
  title: string;
  text: string;
};

type Config = {
  storeUrlAppStore: string;
  storeUrlGooglePlay: string;
  storeUrlChromeWebStore: string;
  
  appUrl: string;
  dappBaseUrl: string;

  colors: {
    primaryFontColor: string;
    primaryBgColor: string;
    primaryButtonFontColor: string;
    primaryButtonBgColor: string;
    secondaryBgColor: string;
    secondaryFontColor: string;
    secondaryButtonFontColor: string;
    secondaryButtonBgColor: string;
  };
};

import {
  primaryBgColor,
  primaryFontColor,
  primaryButtonFontColor,
  primaryButtonBgColor,
  secondaryFontColor,
  secondaryBgColor,
  secondaryButtonFontColor,
  secondaryButtonBgColor,
} from '../constants';

export const useConfig = (): Config => {
  return {
    appUrl: process.env.REACT_APP_DAPP_URL ??  "https://app.mysomeid.dev/home",
    dappBaseUrl: process.env.REACT_APP_DAPP_BASE_URL ??  "https://app.mysomeid.dev",

    storeUrlAppStore: process.env.REACT_APP_STORE ?? "https://apps.apple.com/us/app/id1520190857",
    storeUrlGooglePlay: process.env.REACT_APP_PLAY ?? "https://play.google.com/store/apps/details?id=com.jotterpad.x",
    storeUrlChromeWebStore: process.env.REACT_APP_CHROME_WEBSTORE ??  "https://chrome.google.com/webstore/detail/ad-library-save-facebook/eaancnanphggbfliooildilcnjocggjm",

    colors: {
      primaryFontColor,
      primaryBgColor,
      primaryButtonFontColor,
      primaryButtonBgColor,
      secondaryBgColor,
      secondaryFontColor,
      secondaryButtonFontColor,
      secondaryButtonBgColor,
    },
  };
};
