import { createTheme, responsiveFontSizes } from "@mui/material/styles";

import {fontFaces} from "./fonts";
import commonSettings from "./global";

export const primaryButtonBG = 'rgb(1,22,236)';

export const primaryButtonBGRGB = {
  r: 1,
  g: 22,
  b: 236,
};

export const button2BG = 'rgb(255,255,255)';

export const button2BGRGB = {
  r: 255,
  g: 255,
  b: 255,
};

export const errorText = 'rgb(242, 71, 38)';

export const successText = 'rgb(21, 145, 19)';

export const defaultFontFamily = 'Golos-UI, Inter, Arial';

const themeValues = {
  color: "#333333",
  gold: "#4e5cde",
  gray: "#A3A3A3",
  blueish_gray: "#768299",
  textHighlightColor: "#93AEBC", // "#F4D092",
  // background: "linear-gradient(180deg, #AFCDE9 1%, #F7FBE7 100%)",
  paperBg: "rgba(255, 255, 255, 0.6)",
  modalBg: "#FAFAFAEF",
  popoverBg: "rgba(255, 255, 255, 0.95)",
  backdropBg: "rgba(200, 200, 200, 0.4)",
  largeTextColor: "#759AAE",
  activeLinkColor: "#222222",
  activeLinkSvgColor: "invert(64%) sepia(11%) saturate(934%) hue-rotate(157deg) brightness(90%) contrast(86%)",
  primaryButtonBG: primaryButtonBG, // "rgb(31,34,70)",
  primaryButtonHoverBG: "rgb(0,13,150)",
  primaryButtonHoverColor: "white",
  secondaryButtonHoverBG: "rgba(54, 56, 64, 1)",
  // outlinedPrimaryButtonHoverBG: "#F8CC82",
  // outlinedPrimaryButtonHoverColor: "#333333",
  outlinedSecondaryButtonHoverBG: "#FCFCFC",
  outlinedSecondaryButtonHoverColor: "#333333",
  containedSecondaryButtonHoverBG: "#33333333",
};

const breakpointValues = {
  xs: 0,
  sm: 596,
  md: 800,
  lg: 1000,
  xl: 1333,
};

export const appTheme = responsiveFontSizes(
  createTheme(
    {
      // breakpoints: { values: breakpointValues },

      zIndex: {
        appBar: 9999,
      }, 

      typography: {
        fontSize: 16,
        fontFamily: defaultFontFamily,
        h1: {
          fontSize: "3.3rem",
        },
        h2: {
          fontSize: "2.3rem",
          fontWeight: 600,
          letterSpacing: "1.3px",
        },
        h3: {
          fontSize: "1.75rem",
        },
        h4: {
          fontSize: "1.5rem",
        },
        h5: {
          fontSize: "1.25rem",
          letterSpacing: "0.4px",
        },
        h6: {
          fontSize: "1rem",
        },
        body1: {
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: 1,
        },
        body2: {
          fontSize: "0.75rem",
          fontWeight: 400,
          lineHeight: 1,
        },
        button: {
          textTransform: "none",
          fontSize: "1.25rem",
        },
      },
      
      palette: {
        background: {
          default: "#dcd9e1",
          paper: themeValues.paperBg,
        },
        contrastText: themeValues.color,
        primary: {
          main: "#223340",
        },
        text: {
          primary: themeValues.color,
          secondary: themeValues.blueish_gray,
        },
      },

      components: {
        MuiCssBaseline: {
          styleOverrides: fontFaces,
        },

        MuiMenu: {
          styleOverrides: {
            list: {
              backgroundColor: "#ffffff",
            },
          },
        },

        MuiButton: {
          styleOverrides: {
            containedPrimary: {
              color: 'white',
              fontSize: '16px !important',
              backgroundColor: themeValues.primaryButtonBG,
              "&:hover": {
                backgroundColor: themeValues.primaryButtonHoverBG,
                color: themeValues.primaryButtonHoverColor,
              },
              "@media (hover:none)": {
                color: themeValues.color,
                backgroundColor: themeValues.primaryButtonBG,
                "&:hover": {
                  backgroundColor: themeValues.primaryButtonHoverBG,
                },
              },
            },
            containedSecondary: {
              color: themeValues.color,
              backgroundColor: themeValues.paperBg,
              "&:hover": {
                color: "#FCFCFC",
                backgroundColor: `${themeValues.containedSecondaryButtonHoverBG} !important`,
              },
              "@media (hover:none)": {
                color: themeValues.color,
                backgroundColor: themeValues.paperBg,
                "&:hover": {
                  color: "#FCFCFC",
                  backgroundColor: `${themeValues.containedSecondaryButtonHoverBG} !important`,
                },
              },
            },
            outlinedPrimary: {
              color: themeValues.primaryButtonBG,
              borderColor: themeValues.primaryButtonBG,
              "&:hover": {
                color: themeValues.gold,
                backgroundColor: themeValues.primaryButtonHoverBG,
                borderColor: themeValues.primaryButtonBG,
              },
              "@media (hover:none)": {
                color: themeValues.primaryButtonBG,
                borderColor: themeValues.primaryButtonBG,
                "&:hover": {
                  color: `${themeValues.gold} !important`,
                  backgroundColor: `${themeValues.primaryButtonBG} !important`,
                },
              },
            },
            outlinedSecondary: {
              color: themeValues.color,
              borderColor: themeValues.color,
              "&:hover": {
                color: themeValues.outlinedSecondaryButtonHoverColor,
                backgroundColor: themeValues.outlinedSecondaryButtonHoverBG,
                borderColor: "#333333",
              },
            },
          },
        },
      },
    },
    commonSettings,
  ),
);

export const staticBg = 'linear-gradient(0deg, rgb(255 255 255) 0%, rgb(255 255 255) 49%, rgba(29,32,64,1) 50%, rgba(29,32,64,1) 100%)';

export const staticHeaderBg = 'linear-gradient(0deg, rgb(76 164 231) 0%, rgba(45,155,240,1) 64%, rgb(31 135 216) 100%)';

export const paperSX = {
  color: 'black', // '#303549',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: 2,
  border: '1px solid #dfdfdf30',
  boxShadow: '0px 2px 37px 5px rgba(0,0,0,0.025)',
  marginBottom: '100px',
};

export const pageBg = '';

