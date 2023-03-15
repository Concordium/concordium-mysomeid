import React, {
  useState
} from "react";

import {
  Box,
  Typography,
  Popper,
  Paper as Paper$1,
} from "@mui/material";

import {Icon} from './icon';

import {__rest2} from './utils';

import {Paper} from './paper';

function styleInject(e, t: any = undefined) {
  let s: any;
  const o = (t = void 0 === t ? {} : t).insertAt;
  e && "undefined" != typeof document && (
    s = document.head || document.getElementsByTagName("head")[0],
    (t = document.createElement("style")).type = "text/css",
    "top" === o && s.firstChild ? s.insertBefore(t, s.firstChild) : s.appendChild(t),
    t.styleSheet ? t.styleSheet.cssText = e : t.appendChild(document.createTextNode(e))
  );
}

styleInject(`
.info-icon {
  cursor: pointer;
}

.tooltip {
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 10px;
  padding: 0 !important;
  height: unset;
  height: min-content;
  max-height: min-content;
  width: fit-content;
  margin: 5px !important;
}

.info-tooltip {
  background-color: #00000001;
  backdrop-filter: blur(33px);
  -webkit-backdrop-filter: blur(33px);
  width: 100% !important;
  max-width: 280px !important;
  margin: 0px !important;
  border: 1px solid rgba(118, 130, 153, 0.2);
  white-space: pre-wrap !important;
}
.info-tooltip .info-tooltip-text {
  line-height: 130%;
}`);

type InfoTooltipProps = {
  message: string;
  children?: any;
};

export const InfoTooltip = (props: InfoTooltipProps) => {
  const {
    message, // : e,
    children, //  : t
  } = props;

  const [clicked /*s*/, setClicked /*o*/] = useState(null);

  const eventHandler = (e: React.MouseEvent) => {
    setClicked(clicked ? null : e.currentTarget);
  };
 
  const id = !!clicked ? "info-tooltip" : undefined;

  return (
    <Box {...{
      style: {
        display: "inline-flex",
        justifyContent: "center",
        alignSelf: "center",
      }
    }}>
      <Icon {...{
        name: "info",
        onMouseOver: eventHandler,
        onMouseOut: eventHandler,
        style: {
          margin: "0 5px",
          fontSize: "1em"
        },
        className: "info-icon"
      }} /> 
      <Popper {...{
        id,
        open: !!clicked,
        anchorEl: clicked,
        placement: "bottom",
        className: "tooltip"
      }} >
        <Paper className="info-tooltip">
          <Typography {...{
            variant: "body2",
            className: "info-tooltip-text"
          }}>
            {children || message}
          </Typography>
        </Paper>
      </Popper>
    </Box>
  );
};

type InfoTooltipMultiProps = {
  messagesArray: string[];
};

export const InfoTooltipMulti = (props: InfoTooltipMultiProps) => {
  const {
    messagesArray, // : e
  } = props;
  
  const [clicked, setClicked] = useState(null); // s , t

  const eventHandler = (e: React.MouseEvent) => {
    setClicked(clicked ? null : e.currentTarget);
  };

  const i = !!clicked;
  const l = i ? "info-tooltip" : void 0;

  return (
    <Box>
      <Icon {...{
        name: "info",
        onMouseOver: eventHandler,
        onMouseOut: eventHandler,
        style: {
          margin: "0 5px",
          fontSize: 16
        },
        className: "info-icon"
      }} />
      <Popper {...{
        id: l,
        open: i,
        anchorEl: clicked,
        placement: "bottom",
        className: "tooltip"
      }}> 
        <Paper$1 {...{
          className: "info-tooltip some-card",
          style: {
            padding: "1.33rem"
          }
        }}>
          {messagesArray.map((message, index) => (<div {...{
                                                        style: 0 < clicked ? {marginTop: "1rem"} : {}
                                                       }} >
                                                    <Typography>
                                                      {message}
                                                    </Typography>
                                                  </div>))}
        </Paper$1> 
      </Popper>
    </Box>
  );
}; 

