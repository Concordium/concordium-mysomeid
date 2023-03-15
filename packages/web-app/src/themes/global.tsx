

const commonSettings = {
  direction: "ltr",

  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
    MuiButton: {
      disableElevation: true,
      disableFocusRipple: true,
      disableRipple: true,
    },
    MuiTextButton: {
      disableFocusRipple: true,
      disableRipple: true,
    },
    MuiPaper: {
      elevation: 0,
    },
    MuiTypograph: {
      gutterBottom: true,
    },
    MuiLink: {
      underline: "none",
    },
    MuiSvgIcon: {
      viewBox: "0 0 20 20",
      fontSize: "small",
    },
    MuiBackdrop: {
      transitionDuration: 300,
    },
    MuiPopover: {
      transitionDuration: 300,
    },
  },
};

export default commonSettings;
