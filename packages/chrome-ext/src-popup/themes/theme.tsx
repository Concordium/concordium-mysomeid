import { createTheme, responsiveFontSizes } from "@mui/material/styles";

import {fontFaces} from "./fonts";
import commonSettings, { handleBackdropFilter } from "./global";

const themeValues = {
  color: "#253449",
  gold: "#F8CC82",
  gray: "#A3A3A3",
  blueish_gray: "#768299",
  textHighlightColor: "#93AEBC", // "#F4D092",
  // backgroundColor: "#AFCDE9",
  // background:
  // "radial-gradient(circle at 25% 0%, rgba(227,255,240,.5), rgba(227,255,240,0) 50%), radial-gradient(circle at 80% 80%, rgba(131,165,203,.5), rgba(131,165,203,0) 50%)",
  background: "linear-gradient(180deg, #AFCDE9 1%, #F7FBE7 100%)",
  paperBg: "rgba(255, 255, 255, 0.6)",
  modalBg: "#FAFAFAEF",
  popoverBg: "rgba(255, 255, 255, 0.95)",
  menuBg: handleBackdropFilter("rgba(255, 255, 255, 0.5)"),
  backdropBg: "rgba(200, 200, 200, 0.4)",
  largeTextColor: "#759AAE",
  activeLinkColor: "#222222",
  activeLinkSvgColor: "invert(64%) sepia(11%) saturate(934%) hue-rotate(157deg) brightness(90%) contrast(86%)",
  // primaryButtonBG: "#759AAE",
  primaryButtonBG: "#93AEBC",
  primaryButtonHoverBG: "#759AAE",
  // these need fixing
  primaryButtonHoverColor: "#333333",
  secondaryButtonHoverBG: "rgba(54, 56, 64, 1)",
  outlinedPrimaryButtonHoverBG: "#F8CC82",
  outlinedPrimaryButtonHoverColor: "#333333",
  outlinedSecondaryButtonHoverBG: "#FCFCFC",
  outlinedSecondaryButtonHoverColor: "#333333",
  containedSecondaryButtonHoverBG: "#33333333",
  graphStrokeColor: "rgba(37, 52, 73, .2)",
  gridButtonHoverBackground: "rgba(118, 130, 153, 0.2)",
  gridButtonActiveBackground: "rgba(118, 130, 153, 0.7)",
  switchBg: "#FCFCFC",
};

// console.log('fontFaces ', fontFaces);

export const appTheme = responsiveFontSizes(
  createTheme(
    {
      zIndex: {
        appBar: 9999,
      }, 

      // primary: {
        // main: themeValues.color,
      // },

      palette: {
        // type: "light",
        background: {
          default: "#dcd9e1",
          paper: themeValues.paperBg,
        },
        // contrastText: themeValues.color,
        primary: {
          main: "#223340",
        },
        /* neutral: {
          main: themeValues.color,
          secondary: themeValues.gray,
        }, */
        text: {
          primary: themeValues.color,
          secondary: themeValues.blueish_gray,
        },
        // graphStrokeColor: themeValues.graphStrokeColor,
      },

      typography: {
        fontFamily: "ClearSans",
      },

      components: {
        MuiCssBaseline: {
          styleOverrides: {
            "@fontFace": fontFaces
          },
        },

        MuiTypography: {
        },

        MuiButton: {
          styleOverrides: {
            containedPrimary: {
              color: "#000000",
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

        /* MuiButton: {
          textPrimary: {
            color: themeValues.gray,
            "&:hover": {
              color: themeValues.textHighlightColor,
              backgroundColor: "#00000000",
            },
            "&:active": {
              color: themeValues.gold,
              borderBottom: "#F8CC82",
            },
          },
          textSecondary: {
            color: themeValues.color,
            "&:hover": {
              color: themeValues.textHighlightColor,
            },
          },
        },*/
      },

      /*overrides: {
        MuiSwitch: {
          colorPrimary: {
            color: themeValues.color,
            "&.MuiSwitch-checked": {
              color: themeValues.switchBg,
              "& + .MuiSwitch-track": {
                backgroundColor: themeValues.color,
                borderColor: themeValues.color,
              },
            },
          },
          track: {
            border: `1px solid ${themeValues.color}`,
            backgroundColor: themeValues.switchBg,
          },
        },
        MuiPaper: {
          root: {
            backgroundColor: themeValues.paperBg,
            "&.ohm-card": {
              backgroundColor: themeValues.paperBg,
            },
            "&.MuiPaper-root.tooltip-container": {
              backgroundColor: themeValues.paperBg,
            },
            "&.ohm-modal": {
              backgroundColor: themeValues.modalBg,
            },
            "&.ohm-menu": {
              backgroundColor: themeValues.menuBg,
              backdropFilter: "blur(33px)",
            },
            "&.ohm-popover": {
              backgroundColor: themeValues.popoverBg,
              color: themeValues.color,
              backdropFilter: "blur(15px)",
            },
          },
        },
        MuiDrawer: {
          paper: {
            backgroundColor: themeValues.backdropBg,
            zIndex: 7,
          },
        },
        MuiBackdrop: {
          root: {
            backgroundColor: "rgba(0,0,0, 0.5)",
          },
        },
        MuiLink: {
          root: {
            color: themeValues.color,
            "&:hover": {
              color: themeValues.textHighlightColor,
              textDecoration: "none",
              "&.active": {
                color: themeValues.color,
              },
            },
            "&.active": {
              color: themeValues.color,
              textDecoration: "underline",
            },
            "@media (hover:none)": {
              "&:hover": {
                color: themeValues.textHighlightColor,
                textDecoration: "none",
                backgroundColor: "#00000000 !important",
              },
              "&:focus": {
                color: themeValues.textHighlightColor,
                backgroundColor: "#00000000 !important",
              },
            },
          },
        },
        MuiTableCell: {
          root: {
            color: themeValues.color,
          },
        },
        MuiInputBase: {
          root: {
            color: themeValues.color,
          },
        },
        MuiOutlinedInput: {
          notchedOutline: {
            borderColor: `${themeValues.color} !important`,
            "&:hover": {
              borderColor: `${themeValues.color} !important`,
            },
          },
        },
        MuiTab: {
          textColorPrimary: {
            color: themeValues.blueish_gray,
            "&.MuiTab-selected": {
              color: themeValues.color,
            },
          },
        },
        PrivateTabIndicator: {
          colorPrimary: {
            backgroundColor: themeValues.color,
          },
        },
        MuiToggleButton: {
          root: {
            backgroundColor: themeValues.paperBg,
            "&:hover": {
              color: themeValues.color,
              backgroundColor: themeValues.containedSecondaryButtonHoverBG,
            },
            selected: {
              backgroundColor: themeValues.containedSecondaryButtonHoverBG,
            },
            "@media (hover:none)": {
              "&:hover": {
                color: themeValues.color,
                backgroundColor: themeValues.paperBg,
              },
              "&:focus": {
                color: themeValues.color,
                backgroundColor: themeValues.paperBg,
              },
            },
          },
        },
        MuiIconButton: {
          root: {
            "&:hover": {
              backgroundColor: themeValues.containedSecondaryButtonHoverBG,
            },
            "@media (hover:none)": {
              "&:hover": {
                color: themeValues.color,
                backgroundColor: themeValues.containedSecondaryButtonHoverBG,
              },
              "&:focus": {
                color: themeValues.color,
                backgroundColor: themeValues.containedSecondaryButtonHoverBG,
              },
            },
          },
        },
        MuiSelect: {
          select: {
            color: "#93AEBC",
          },
        },
        MuiButton: {
          containedPrimary: {
            color: "#FCFCFC",
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
          textPrimary: {
            color: themeValues.gray,
            "&:hover": {
              color: themeValues.textHighlightColor,
              backgroundColor: "#00000000",
            },
            "&:active": {
              color: themeValues.gold,
              borderBottom: "#F8CC82",
            },
          },
          textSecondary: {
            color: themeValues.color,
            "&:hover": {
              color: themeValues.textHighlightColor,
            },
          },
        },
        MuiGrid: {
          root: {
            "&.grid-button": {
              borderColor: `${themeValues.gridButtonActiveBackground} !important`,
              "&:hover": {
                backgroundColor: themeValues.gridButtonHoverBackground,
              },
              "&.current": {
                backgroundColor: themeValues.gridButtonActiveBackground,
                "&:hover": {
                  backgroundColor: themeValues.gridButtonHoverBackground,
                },
              },
            },
          },
        },
      },*/
    },
    commonSettings,
  ),
);
