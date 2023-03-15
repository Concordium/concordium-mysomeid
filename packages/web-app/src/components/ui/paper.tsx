import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Box,
  Typography,
  Paper as Paper$1,
  Zoom,
  Grid,
  Modal as MUIModal,
  // Backdrop,
} from "@mui/material";

import {  makeStyles,} from '@mui/styles';

import {__rest2} from './utils';

import {InfoTooltip} from './info-tooltip';

const useStyles = makeStyles(() => ({
  root: {
    "&::before": {
      content: '""',
      backgroundColor: "transparent",
      opacity: "0",
      zIndex: 4,
      filter: "blur(33px)",
      height: "100%",
      width: "100%"
    },
    zIndex: 5,
    backdropFilter: "blur(33px)",
    padding: "20px 30px 30px 30px",
    borderRadius: "10px",
    maxWidth: (e: any) => { 
      return e.fullWidth ? "100%" : "833px";
    },
    width: (e: any) => e.fullWidth ? "100%" : "97%",
    marginBottom: "1.8rem",
    overflow: "hidden",
    "& .card-header": {
      width: "100%",
      minHeight: "33px",
      marginBottom: "10px",
      position: "relative",
      "& h5": {
        fontWeight: "600"
      }
    },
    "& .MuiPaper-root": {
      background: (e: any) => e.childPaperBackground ? "" : "transparent",
      backdropFilter: (e: any) => e.childPaperBackground ? "" : "none",
      "-webkitBackdropFilter": (e: any) => e.childPaperBackground ? "" : "none"
    }
  },
  topLeft: {

  }
}));

type IPaperProps = {
  headerText?: string | React.ReactNode;
  headerContent?: string | React.ReactNode;
  className?: string;
  tooltip?: string;
  fullWidth?: string;
  topLeft?: any;
  topRight?: any;
  zoom?: boolean;
  subHeader?: any;
  childPaperBackground?: boolean;
  children?: any;
};

export function Paper( props: IPaperProps ) {
  const {
    headerText, // t,
    headerContent, // : s,
    className: className = '', // o = "",
    tooltip, //: i,
    fullWidth, // : l,
    topLeft, // : a,
    topRight, // : d,
    zoom: zoom = true, // r = !0,
    subHeader, // : c,
    childPaperBackground: childPaperBackground = false, // n = false,
  } = props;

  const rest = __rest2<{children: any, style?: any}>(props, [
    "headerText",
    "headerContent",
    "className",
    "tooltip",
    "fullWidth",
    "topLeft",
    "topRight",
    "zoom",
    "subHeader",
    "childPaperBackground"
  ]);

  const styles = useStyles({
    fullWidth,
    childPaperBackground,
  });

  return (
    <Zoom {...{
      in: true,
      appear: zoom,
    }}>
      <Paper$1 {...{
        className: styles.root + " " + className,
        ...rest,
        elevation: 0,
        style: {
          ...(rest?.style || {}),
          overflowY: 'scroll',
        },
      }}>
        <Grid {...{
          container: !0,
          direction: "column",
          spacing: 2,
        }}>
          {(!!topLeft || !!topRight || !!headerText || !!headerContent) ?
            <Grid {...{
              item: !0,
              className: "card-header"
            }}>
              <Box {...{
                id: 'box',
                style: {
                  display: "flex",
                  justifyContent: "space-between"
                },
              }}>
                {topLeft ? <div className="top-left">{topLeft}</div> : undefined}
                {(headerContent && !headerContent) ?
                  <Box {...{
                    style: {
                      display: "flex",
                      flexDirection: "row"
                    }
                  }}>
                    <Typography {...{
                      variant: "h5",
                      className: "header-text"
                    }}>
                      {headerText}
                    </Typography>
                  </Box> : undefined
                }
                {tooltip ?
                  <Box {...{
                    display: "inline",
                    alignSelf: "center",
                    style: {
                      fontSize: "9px"
                    }
                  }}>
                    <InfoTooltip message={tooltip}/>
                  </Box> : undefined
                }
                {headerContent}
                {topRight ? <div className="top-right">{topRight}</div> : undefined}
                {subHeader ? <Box {...{display: "flex"}}>{subHeader}</Box> : undefined}
              </Box>
            </Grid> : undefined
          }
          <Grid item={true}>{rest.children}</Grid>
        </Grid>
      </Paper$1>
    </Zoom>
  );
}


