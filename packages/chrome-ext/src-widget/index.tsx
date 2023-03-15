import React from "react";
import ReactDOM from "react-dom/client";
import { Route, HashRouter } from "react-router-dom";

import App from "./App";

import "./style.css";

import theme from './theme';

import {
    CssBaseline,
    ThemeProvider
} from '@mui/material';
    
const rootElement = document.createElement("div");
rootElement.id = "root";

const append = () => document.body.appendChild(rootElement);
!document.body ? window.addEventListener('DOMContentLoaded', append ) : append();

const root = ReactDOM.createRoot(rootElement);
root.render(
    <ThemeProvider {...{theme}}>
        <CssBaseline />
        <HashRouter>
            <App />
        </HashRouter>
    </ThemeProvider>,
);
