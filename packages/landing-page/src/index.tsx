import * as React from 'react';
import {
  BrowserRouter,
} from "react-router-dom";
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './app';
import theme from './theme';
import "./fonts/DIN Alternate Bold.ttf";
import "./index.css";

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

root.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>,
  </BrowserRouter>
);
