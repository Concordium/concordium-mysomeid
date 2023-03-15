import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./style.css";

import theme from './theme';

// import {storage} from './utils';

import {
    CssBaseline,
    ThemeProvider
} from '@mui/material';
 
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <ThemeProvider {...{theme}}>
        <CssBaseline />
        <App />
    </ThemeProvider>,
);
