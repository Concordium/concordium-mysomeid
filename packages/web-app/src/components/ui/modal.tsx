import React from "react";

import {
  IconButton,
  Modal as MUIModal,
  Backdrop,
} from "@mui/material";

import {
  makeStyles,  
} from '@mui/styles';

import {__rest} from './utils';

import {Icon} from './icon';

import {Paper} from './paper';

const useStyles = makeStyles((theme: any) => ({
  paper: {
    "& .MuiIconButton-sizeSmall": {
      padding: "0px",
      marginRight: "-9px"
    },
    "& .modalDismiss": {
      marginLeft: "auto",
      display: "flex"
    },
    position: "absolute",
  },
  backdrop: {
    "&::before": {
      "@supports not ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
        content: '""',
        background: "dark" === theme.palette.type ? "linear-gradient(180deg, rgba(8, 15, 53, 0), rgba(0, 0, 10, 0.9)), linear-gradient(333deg, rgba(153, 207, 255, 0.2), rgba(180, 255, 217, 0.08)), radial-gradient(circle at 77% 89%, rgba(125, 163, 169, 0.8), rgba(125, 163, 169, 0) 50%), radial-gradient(circle at 15% 95%, rgba(125, 163, 169, 0.8), rgba(125, 163, 169, 0) 43%), radial-gradient(circle at 65% 23%, rgba(137, 151, 119, 0.4), rgba(137, 151, 119, 0) 70%), radial-gradient(circle at 10% 0%, rgba(187, 211, 204, 0.33), rgba(187,211,204,0) 35%), radial-gradient(circle at 11% 100%, rgba(131, 165, 203, 0.3), rgba(131, 165, 203, 0) 30%)" : "linear-gradient(180deg, #AFCDE9 1%, #F7FBE7 100%)",
        opacity: "1",
        filter: "blur(333px)",
        height: "100%",
        width: "100%",
        backgroundColor: theme.palette.background.default
      }
    },
    "@supports not ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
      background: "hsla(0,0%,39.2%,.9)"
    },
    background: "hsla(0,0%,39.2%,.1)",
    backdropFilter: "blur(33px)",
    "-webkitBackdropFilter": "blur(33px)"
  }
}));

type IModalProps = {
  id?: string;

  open?: boolean;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;

  closePosition?: string;
  headerText?: any;
  headerContent?: any;
  topRight?: string;
  topLeft?: string;

  onClose?: (event: any, keyDown: string) => void;

  backdropClass?: string;
  paperClass?: string;

  sx?: any;

  PaperProps?: any;

  children: any;
};

export function Modal(props: IModalProps) {
  const {
    id,
    open: open = false,
    minHeight: minHeight = "605px",
    maxWidth: maxWidth = "750px",
    closePosition: closePosition = "right",
    headerText,
    headerContent,
    topRight,
    topLeft,
    maxHeight,
    children,
    sx,
    PaperProps,
  } = props;

  const moreArgs = __rest(props, [
    "open",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "closePosition",
    "headerText",
    "headerContent",
    "topRight",
    "topLeft",
    "sx",
    "PaperProps",
  ]);

  const styles = useStyles({
    minHeight,
    maxWidth
  });

  const closeButton = (
    <IconButton {...{
      "aria-label": "close",
      color: "inherit",
      size: "small",
      onClick: (event: React.MouseEvent) => {
        moreArgs.onClose && moreArgs.onClose(event, "escapeKeyDown")
      }
    }} >
      <Icon {...{name: 'x'}}/>
    </IconButton>
  );

  const tr = closePosition === "right" ? closeButton : topRight;
  const tl = closePosition === "left"  ? closeButton : topLeft;

  const args = e => {
    console.log(e);
    return e;
  };

  return (
    <MUIModal {...{
      ...moreArgs,
      id,
      open,
      className: (moreArgs as any).className,
      "aria-labelledby": "modal-title",
      "aria-describedby": "modal-description",
      BackdropComponent: Backdrop,
      BackdropProps: {
        className: styles.backdrop,
      },
      sx: (theme) => ({
        ...(sx === 'function' ? sx(theme) : sx ?? {}),
      }),
    }}>
      <>
        <Paper {...{
          className: styles.paper,
          style: {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxHeight: maxHeight ?? undefined,
            background: 'white',
          },
          sx: theme => ({
            minHeight: t => (t as any).minHeight,
            [theme.breakpoints.down("sm")]: {
              maxWidth: "none"
            },
            [theme.breakpoints.up("sm")]: {
              maxWidth: t => (t as any).maxWidth
            },
            ...(PaperProps?.sx !== undefined ?
                typeof PaperProps?.sx === 'function' ?
                  PaperProps?.sx(theme) :
                  PaperProps?.sx :
                {})
          }),
          topRight: tr,
          topLeft: tl,
          zoom: false,
          headerText,
          headerContent,
        }}>
          {children}
        </Paper>
      </>
    </MUIModal>
  );
}
