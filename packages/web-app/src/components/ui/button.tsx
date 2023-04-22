import React, {
  useEffect,
  useState
} from "react";

import {
  Button as MUIButton,
  // ButtonProps as MUIButtonProps,
  SvgIcon,
  Color,
} from "@mui/material";

import {
  makeStyles,  
} from '@mui/styles';

import {Icon} from './icon';

import {
  __rest,
  __rest2,
  getSX,
} from './utils';
import { button2BGRGB, defaultFontFamily, primaryButtonBGRGB } from "src/themes/theme";

function addFontSizes(theme: any, bp600: number, bp900: number, bp1200: number) {
  return {
    [theme.breakpoints.up(600)]: {
      fontSize: `${bp600}px`
    },
    [theme.breakpoints.up(900)]: {
      fontSize: `${bp900}px`
    },
    [theme.breakpoints.up(1200)]: {
      fontSize: `${bp1200}px`
    },    
  }
}

function addOutsideProps (theme: any, sx: any) {
  if ( typeof sx === 'function' ) {
    return sx(theme);
  }
  return sx ?? {};
}

const useStyles = makeStyles((theme: any) => ({
  root: {
    fontSize: "16px",
    height: "36px",
    // borderRadius: "3px",
    lineHeight: "24px",
    margin: "4.5px",
    textTransform: "none",
    textDecoration: "none",
    whiteSpace: "nowrap",
    minWidth: "max-content",
    maxHeight: "39px",
    padding: ({icon}: {icon: boolean}) => icon ? "9px" : "6px 16px",
    "&.MuiButton-text": {
      "&:hover": {
        backgroundColor: "transparent"
      }
    },
    "& .MuiSvgIcon-root": {
      fontSize: "14px"
    },
    "&.MuiButton-containedPrimary": {
      // border: 0,
      fontWeight: "500"
    },
    "&.MuiButton-fullWidth": {
      marginLeft: "0px",
      marginRight: "0px"
    },
    "&.MuiButton-sizeLarge": {
      minWidth: ({icon}: {icon: boolean}) => icon ? "inherit" : "250px",
      height: "51px",
      maxHeight: "51px",
      padding: ({icon}: {icon: boolean}) => icon ? "12px" : "6px 16px",
      fontSize: "16px",
      "& .MuiSvgIcon-root": {
        fontSize: "27px"
      }
    },
    "&.MuiButton-sizeSmall": {
      padding: ({icon}: {icon: boolean}) => icon ? "6px" : "0px 16px",
      height: "36px",
      fontSize: "16px",
      "& .MuiSvgIcon-root": {
        fontSize: "18px"
      }
    },
    "&.MuiButton-sizeMedium": {
      padding: ({icon}: {icon: boolean}) => icon ? "6px" : "0px 16px",
      height: "36px",
      fontSize: "16px",
      "& .MuiSvgIcon-root": {
        fontSize: "18px"
      }
    },
    "&.MuiButton-endIcon": {
      marginLeft: "5px"
    },
    "&.MuiButton-startIcon": {
      marginRight: "5px"
    },
    "&.MuiButton-secondarySizeMedium": {
    }
  }
}));

type ButtonColor = "error" | "info" | "inherit" | "primary" | "secondary" | "success" | "warning"; // Pick<Button$1Props, 'color'>;

type CustomButtonProps = {
  id?: string;
  type?: string;
  disableElevation?: boolean;
  disableFocusRipple?: boolean;
  disableRipple?: boolean;
  template?: "primary" | "secondary" | "tertiary" | "text";
  startIcon?: any;
  children?: any;
  icon?: any;
  color?: ButtonColor;
  className?: string;
  disabled?: boolean;
  helpText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  sx?: any;
};

export const CustomButton = (props: CustomButtonProps) => {
  const {
    id,
    type,
    disableElevation: disableElevation = !0, // t
    disableFocusRipple: disableFocusRipple = !0, // s
    disableRipple: disableRipple = !0, // o
    template: template = "primary", /*i */
    startIcon: startIcon, // l
    sx,
  } = props;

  const moreProps /* a */ = __rest2<{
    icon: any;
    children: any;
    variant:  "text" | "outlined" | "contained";
    color: ButtonColor;
    endIcon: string;
    href: string;
    className: string;
  }>(props,
    [
      "disableElevation",
      "disableFocusRipple",
      "disableRipple",
      "template",
      "startIcon",
      "sx",
    ]
  );

  const styles /*e*/ = useStyles({
    icon: !(!moreProps.icon || moreProps.children),
  });

  let d = moreProps.variant;
  let r = moreProps.color as ButtonColor;
 
  switch (template) {
    case "primary":
      d = "contained";
      r = "primary" as unknown as ButtonColor;
      break;
    case "secondary":
      d = "outlined";
      r = "secondary" as unknown as ButtonColor;
      break;
    case "tertiary":
      d = "outlined";
      r = "primary" as unknown as ButtonColor;
      break;
    case "text":
      d = "text";
      r = "secondary" as unknown as ButtonColor;
  }

  const c = moreProps.href ? { target: "_blank" } : {};

  const icon /*i*/ = moreProps.endIcon || moreProps.href && "arrow-up" || null;

  return (
    <MUIButton {...{
      id,
      type,
      variant: d,
      color: r,
      className: `${styles.root} ${moreProps.className}`,
      disableElevation,
      disableFocusRipple,
      disableRipple,
      startIcon: startIcon ?  <Icon {...{
                                name: startIcon,
                                fontSize: "large"
                              }} /> : undefined,
      endIcon: icon ? <Icon {...{
                        name: icon,
                        fontSize: "large"
                      }} /> : undefined,
      ...moreProps,
      ...c,
      sx,
    }}>
      {moreProps.icon && !moreProps.children ?
        <Icon name={moreProps.icon} /> :
        moreProps.children
      }
    </MUIButton>
  );
};

export const hoverDarkenButton = -25;

export const buttonColor = primaryButtonBGRGB;

export const hoverDarkenButton2 = -10;

export const button2Color = button2BGRGB;

export const PrimaryButton = props => <CustomButton {...{
  ...props,
  sx: theme => {
    const tmp = ({
      alignItems: 'center',
      display: 'inline-flex',
      justifyContent: 'center',
      position: 'relative',
      boxSizing: 'border-box',
      outline: '0',
      margin: '0',
      cursor: 'pointer',
      userSelect: 'none',
      verticalAlign: 'middle',
      appearence: 'none',
      textDecoration: 'none',
      minWidth: '64px',
      transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      color: 'rgb(255,255,255)',
      backgroundColor: `rgb(${buttonColor.r}, ${buttonColor.g}, ${buttonColor.b})`,
      boxShadow: 'none',
      fontFamily: defaultFontFamily,
      fontWeight: '500',
      lineHeight: '1.5rem',
      fontSize: '14px',
      padding: '6px 12px',
      height: '36px',
      "&:hover": {
        backgroundColor: `rgb(${buttonColor.r + hoverDarkenButton}, ${buttonColor.g + hoverDarkenButton}, ${buttonColor.b + hoverDarkenButton})`,
        // backgroundColor: 'red',
        color: 'white',
      },
      "&.Mui-disabled": {
        color: 'white',
        opacity: 0.2,
      },
      ...addFontSizes(theme, 16, 16, 16),
    });

    const tmp2 = {
      ...tmp,
      ...addOutsideProps(theme, props.sx),
    };

    return tmp2;
  },
  template: "primary",
}} />;

/*export const SecondaryButton = props => <BuilderButton {...{...props, sx: theme => ({
    height: '36px',
    ...addFontSizes(theme, 16, 16, 16)
  }),
  template: "secondary" }} />;*/

export const SecondaryButton = props => <CustomButton {...{
  ...props,
  sx: theme => ({
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    outline: '0',
    margin: '0',
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    appearence: 'none',
    textDecoration: 'none',
    minWidth: '64px',
    transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    color: 'rgb(48,53,73)',
    backgroundColor: `rgb(${button2Color.r}, ${button2Color.g}, ${button2Color.b})`,
    boxShadow: 'none',
    fontFamily: defaultFontFamily,
    fontWeight: '500',
    lineHeight: '1.5rem',
    fontSize: '14px',
    padding: '6px 12px',
    height: '36px',
    "&:hover": {
      backgroundColor: `rgb(${button2Color.r + hoverDarkenButton2}, ${button2Color.g + hoverDarkenButton2}, ${button2Color.b + hoverDarkenButton2})`,
      color: 'rgb(0,0,0)',
    },
    ...addFontSizes(theme, 16, 16, 16),
    ...addOutsideProps(theme, props.sx),
  }),
  template: "primary",
}} />;

export const TertiaryButton = props => <CustomButton {...{...props, sx: theme => ({
    height: '36px',
    ...addFontSizes(theme, 16, 16, 16),
    ...addOutsideProps(theme, props.sx),
  }),
  template: "tertiary" }} />;

export const TextButton = props => <CustomButton {...{...props, sx: theme => ({
    height: '36px',
    ...addFontSizes(theme, 16, 16, 16),
  }),
  template: "text" }} />;

const GhostButton = props => <CustomButton {...{
    ...props,
    sx: theme => {
      return {
        ...({
          alignItems: 'center',
          display: 'inline-flex',
          justifyContent: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          outline: '0',
          margin: '0',
          cursor: 'pointer',
          userSelect: 'none',
          verticalAlign: 'middle',
          appearence: 'none',
          textDecoration: 'none',
          minWidth: '64px',
          color: 'rgb(48, 53, 73)',
          backgroundColor: undefined,
          boxShadow: 'none',
          fontFamily: defaultFontFamily,
          fontWeight: '500',
          lineHeight: '1.5rem',
          fontSize: '14px',
          padding: '6px 12px',
          height: '36px',
          "&.Mui-disabled": {
            opacity: 0.2,
          },
          ...addFontSizes(theme, 16, 16, 16),
        }),
        ...addOutsideProps(theme, props.sx),
      };
    },
    template: "primary",
  }} />;

const WeakButton = props => <CustomButton {...{
  ...props,
  sx: theme => {
    return {
      ...({
        alignItems: 'center',
        display: 'inline-flex',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        outline: '0',
        margin: '0',
        cursor: 'pointer',
        userSelect: 'none',
        verticalAlign: 'middle',
        appearence: 'none',
        textDecoration: 'none',
        minWidth: '64px',
        color: 'rgb(48, 53, 73)',
        backgroundColor: "#e6e6e6",
        boxShadow: 'none',
        fontFamily: defaultFontFamily,
        fontWeight: '500',
        lineHeight: '1.5rem',
        fontSize: '14px',
        padding: '6px 12px',
        height: '36px',
        "&.Mui-disabled": {
          opacity: 0.2,
        },
        "&:hover": {
          backgroundColor: `#d5d3d3`,
          color: 'rgb(48, 53, 73)',
        },    
        ...addFontSizes(theme, 16, 16, 16),
      }),
      ...addOutsideProps(theme, props.sx),
    };
  },
  template: "primary",
}} />;


type ButtonProps = CustomButtonProps & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'text' | 'ghost' | 'weak';
};

export const Button = (props: ButtonProps) => (
  !props.variant || props.variant === 'primary' ?
    <PrimaryButton {...props} /> :
  props.variant === 'secondary' ?
    <SecondaryButton {...props} /> :
  props.variant === 'tertiary' ?
    <TertiaryButton {...props} /> :
  props.variant === 'ghost' ?
    <GhostButton {...props} /> :
  props.variant === 'weak' ?
    <WeakButton {...props} /> :
  props.variant === 'text' ?
    <TextButton {...__rest(props, ['variant'])} /> :
    undefined
);

