import puppeteer, { Page, Browser } from 'puppeteer'; // import Puppeteer
import * as path from 'path';

// Path to the actual extension we want to be testing
const extFolder = path.join(__dirname, '..', '..', 'chrome-ext', 'build');
const ccdWalletExt = path.join('extensions', 'dist');

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--show-component-extension-options`,
  `--disable-extensions-except=${extFolder},${ccdWalletExt}`
];

// console.log("args", puppeteerArgs);

puppeteer.launch({
  headless: false,
  slowMo: 250,
  devtools: true,
  userDataDir: path.join('user-data'),
  args: puppeteerArgs,
}).then();



