import {default as pkg} from "../package.json";
window.process = {} as any;
import "./index.css";
import * as ReactDOM from "react-dom/client";
import {Root} from "./root";

const ve = pkg.version;
console.log(`*********************************`);
console.log(`* https://app.mysome.id         *`);
console.log(`* version: ${ve}                *`);
console.log(`*********************************`);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);
