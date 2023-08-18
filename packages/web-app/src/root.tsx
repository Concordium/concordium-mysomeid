/* eslint-disable global-require */
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Outlet } from "react-router";
import { LastLocationProvider } from "react-router-dom-last-location";
// import { QueryClientProvider } from "react-query";
import { Provider } from "react-redux";
import { ThemeProvider as MUI5ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as LegacyThemeProvider } from '@mui/styles';
import { CssBaseline } from "@mui/material";
import { appTheme } from "./themes";
import App from "./app";
import store from "./store";
import { CCDContextProvider } from "./hooks";
import { ExtensionProvider } from './hooks/use-extension';
import { APIContextProvider } from "./hooks/use-api";
import { AnalyticsContextProvider  } from "./hooks/use-analytics";

export const Root: React.FC = () => {
  return (
    <Provider store={store}>
      <ExtensionProvider>
        <CCDContextProvider>
          <APIContextProvider>
            <AnalyticsContextProvider>
              <BrowserRouter>
                <LastLocationProvider>
                  <Outlet />
                  <MUI5ThemeProvider theme={appTheme}>
                  <LegacyThemeProvider theme={appTheme}>
                    <CssBaseline />
                    <App />
                  </LegacyThemeProvider>
                  </MUI5ThemeProvider>
                </LastLocationProvider>
              </BrowserRouter>
            </AnalyticsContextProvider>
          </APIContextProvider>
        </CCDContextProvider>
      </ExtensionProvider>
    </Provider>
  );
};
