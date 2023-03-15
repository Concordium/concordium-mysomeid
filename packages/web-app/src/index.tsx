// window.Buffer = require('buffer').Buffer;
window.process = {} as any;
import "./index.css";

// import ReactDOM from "react-dom";
import * as ReactDOM from "react-dom/client";

import {default as pkg} from "../package.json";

console.log("Version " + pkg.version);

import {Root} from "./root";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);
