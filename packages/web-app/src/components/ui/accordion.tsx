import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  //makeStyles,
  SvgIcon,
  Button as Button$1,
  Box,
  Popper,
  Typography,
  Paper as Paper$1,
  Zoom,
  Grid,
  Accordion as Accordion$1,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Modal as MUIModal,
  Backdrop,
  Collapse,
  Link,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Snackbar,
  LinearProgress,
  Tab as Tab$1,
  Tabs as Tabs$1
} from "@mui/material";

import {makeStyles} from '@mui/styles';

import {__rest} from './utils';

import {Icon} from './icon';

const useStyles = makeStyles(() => ({
  root: {
    "& .MuiAccordionSummary-content": {
      display: "initial",
      margin: "initial"
    },
    "&.MuiAccordion-root": {
      backdropFilter: "none",
      backgroundColor: "transparent"
    },
    "& .MuiAccordionDetails-root": {
      padding: "0px 0px 0px 16px",
      "& .nav-item-container": {
        marginLeft: "16px"
      }
    },
    "& .MuiAccordionSummary-expandIcon": {
      padding: "0px 22px"
    },
    "& .MuiAccordionSummary-root": {
      minHeight: "initial",
      padding: "initial"
    }
  }
}));

type IAccordionProps = {
  summary: {
    linkElem?: React.ReactNode
  };
  children?: any;
  arrowOnlyCollapse?: boolean;
  defaultExpanded?: boolean;
};

export function Accordion(props: IAccordionProps /*e*/ ) {
  const {
    summary, // : t,
    children, // : s,
    arrowOnlyCollapse: arrowOnlyCollapse = false, // o = !1,
    defaultExpanded: defaultExpanded = true, //i = !0
  } = props;

  const rest /*l*/ = __rest(props, [
    "summary",
    "children",
    "arrowOnlyCollapse",
    "defaultExpanded",
    "className",
  ]);

  const [
    expanded, /*a*/
    setExpanded, /*d*/
  ] = useState(false);

  const styles /*e*/ = useStyles();

  useEffect(() => {
    arrowOnlyCollapse && defaultExpanded && setExpanded(!0);
  }, [defaultExpanded]);

  return (
    <Accordion$1 {...{
      square: true,
      elevation: 0,
      expanded: arrowOnlyCollapse ? expanded : (void 0),
      defaultExpanded,
      ...rest,
      className: styles.root + " " + (rest as any).className,
    }}>
      <AccordionSummary {...{
        expandIcon: <Icon {...{
                      className: "accordion-arrow",
                      name: "arrow-down",
                      style: {
                        fontSize: 12
                      }
                    }} />,
        IconButtonProps: {
          onClick: () => {
            setExpanded(!expanded);
          }
        }
      }} />
      <AccordionDetails {...{children}}/>
    </Accordion$1>
  );
}
