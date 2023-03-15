import { createTheme, responsiveFontSizes } from "@mui/material/styles";

import {fontFaces} from "./fonts";
import commonSettings from "./global";

const themeValues = {
  color: "#253449",
  gold: "#F8CC82",
  gray: "#A3A3A3",
  blueish_gray: "#768299",
  textHighlightColor: "#93AEBC", // "#F4D092",
  background: "linear-gradient(180deg, #AFCDE9 1%, #F7FBE7 100%)",
  paperBg: "rgba(255, 255, 255, 0.6)",
  modalBg: "#FAFAFAEF",
  popoverBg: "rgba(255, 255, 255, 0.95)",
  backdropBg: "rgba(200, 200, 200, 0.4)",
  largeTextColor: "#759AAE",
  activeLinkColor: "#222222",
  activeLinkSvgColor: "invert(64%) sepia(11%) saturate(934%) hue-rotate(157deg) brightness(90%) contrast(86%)",
  primaryButtonBG: "rgb(31,34,70)",
  primaryButtonHoverBG: "rgb(51,44,80)",
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
        fontFamily: "Golos-UI, Inter, Arial", // Golos-UI, Inter, Arial",
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

console.log('theme', appTheme);
