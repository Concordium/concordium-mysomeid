import "./top-bar.scss";

// import { i18n } from "@lingui/core";
// import { t } from "@lingui/macro";
import { AppBar, Box, Button, SvgIcon, Toolbar } from "@mui/material";
import { makeStyles } from "@mui/styles";

import { ReactComponent as MenuIcon } from "src/assets/icons/hamburger.svg";

import {AppTheme} from "src/themes";

const useStyles = makeStyles((theme: AppTheme) => ({
  appBar: {
    [theme.breakpoints.up("sm")]: {
      width: "100%",
      padding: "10px",
    },
    justifyContent: "flex-end",
    alignItems: "flex-end",
    background: "transparent",
    backdropFilter: "none",
    zIndex: 10,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(981)]: {
      display: "none",
    },
  },
}));

interface TopBarProps {
  // theme: string;
  // toggleTheme: (e: KeyboardEvent) => void;
  handleDrawerToggle: () => void;
  displayWallet?: boolean;
  displayConnect?: boolean;
}

function TopBar({ displayWallet, displayConnect, handleDrawerToggle }: TopBarProps) {
  const classes = useStyles();

  const openWallet = () => {console.log('asd');};

  return (
    <AppBar position="sticky" className={classes.appBar} elevation={0}>
      <Toolbar disableGutters className="dapp-topbar">
        <Button
          id="hamburger"
          aria-label="open drawer"
          size="large"
          variant="contained"
          color="secondary"
          onClick={handleDrawerToggle}
          className={classes.menuButton}
        >
          <SvgIcon component={MenuIcon} />
        </Button>
        <Box display="flex">
          {/*displayWallet ? <Wallet /> : undefined*/}          
          {/*<ThemeSwitcher {...{theme, toggleTheme}} />*/}
          {/*<LocaleSwitcher {...{
            initialLocale: i18n.locale,
            locales,
            onLocaleChange: selectLocale,
            label: t`Change locale`,
          }} />*/}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
