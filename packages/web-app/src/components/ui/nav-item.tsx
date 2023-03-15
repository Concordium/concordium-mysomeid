import {
  useState
} from "react";

import {
  NavLink
} from "react-router-dom";

import {
  Box,
  Typography,
  Link,
  Chip,
} from "@mui/material";

import {
  makeStyles,  
} from '@mui/styles';

import {__rest2} from './utils';

import {Icon} from './icon';

import {
  Accordion
} from './accordion';

const useStyles = makeStyles(() => ({
  root: {
    paddingTop: "0.7rem",
    marginLeft: "30px",
    alignItems: "center",
    paddingBottom: "0.5rem",
    marginRight: "18px",
    "& svg": {
      marginRight: "12px",
      verticalAlign: "-4px"
    },
    "& svg.accordion-arrow": {
      marginRight: "0px"
    },
    "& .external-site-link": {
      "& .external-site-link-icon": {
        opacity: "0"
      },
      "&:hover .external-site-link-icon": {
        marginLeft: "5px",
        opacity: "1"
      }
    }
  }
}));

type INavItemProps = {
  href?: string;
  chip?: string;
  className?: string;
  icon?: string;
  label: string;
  to: string;
  defaultExpanded?: boolean;
  children?: any;
};

const LinkElem = ({linkProps, icon, chip, rest, label}: {linkProps: any, chip: any, icon: any, rest: any, label: string}) => (
  <Link {...{
    ...linkProps,
    ...rest,
  }}>
    <Typography variant="h6">
        <Box {...{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between"              
        }}>
          <div>
            {icon ? <Icon name={icon} /> : undefined}
            {label}
            {rest?.href ? <Icon {...{
              className: "external-site-link-icon",
              name: "arrow-up"
            }} /> : undefined}
          </div>
          {chip ? <Chip {...{
            size: "small",
            label: chip,
            color: "primary"
          }}/> : undefined}
        </Box>
    </Typography>
  </Link>
);

export function NavItem( props: INavItemProps /*e*/ ) {
  const {
    chip, // : t,
    className: className = '', // : s = "",
    icon, // : o,
    label, // : i,
    to, // : l,
    children, //: a,
    defaultExpanded: defaultExpanded = true, // : d = !0
  } = props;

  const rest = __rest2<{
    href: string,
  }>(props, [
    "chip",
    "className",
    "icon",
    "label",
    "to",
    "children",
    "defaultExpanded"
  ]);

  useState(false);
  
  const styles /*e*/ = useStyles();

  const linkProps = rest.href ? {
    href: rest.href,
    target: "_blank",
    className: "external-site-link " + className /*s*/
  } : { 
    component: NavLink,
    to: to /*l*/,
    className: "button-dapp-menu " + className /*s*/
  };

  // summary: <LinkElem {...{linkProps, icon, chip, rest, label}} />

  return (
    <div {...{
      className: styles.root + " nav-item-container"
    }}>
      {children ? <Accordion {...{
             defaultExpanded,
             arrowOnlyCollapse: true,
             summary: {
              linkElem: <LinkElem {...{linkProps, icon, chip, rest, label}} />
             },
           }}>{children}</Accordion> : <LinkElem {...{linkProps, icon, chip, rest, label}}/>}
    </div>
  );
}


