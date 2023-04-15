import puppeteer, { Page, Browser } from 'puppeteer'; // import Puppeteer
import * as path from 'path';

// Path to the actual extension we want to be testing
const extFolder = process.env.EXT_FOLDER ?? path.join(__dirname, '..', '..', 'chrome-ext', 'build');
const ccdWalletExt = path.join('extensions', 'dist');

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--show-component-extension-options`,
  `--disable-extensions-except=${extFolder},${ccdWalletExt}`
];

const userDataDir = path.join(process.cwd(), 'user-data');

console.log("puppeteerArgs", puppeteerArgs);
console.log('userDataDir', userDataDir);

puppeteer.launch({
  headless: false,
  slowMo: 250,
  devtools: true,
  userDataDir,
  args: puppeteerArgs,
}).then();

