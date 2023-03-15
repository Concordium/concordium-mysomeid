import * as puppeteer from 'puppeteer';
import { Chromeless } from 'chromeless';
import * as fs from 'fs';
const Timeout = {
    set: async (n) => {
        return new Promise(resolve => {
            setTimeout(resolve, n);
        });
    },
};
const setViewportWidthHeight = false;
const g_width = 1680;
const g_height = 1050;
export class BrowserInterface {
    options;
    browser;
    debuggerPage;
    debuggerChromeless;
    pages = [];
    initialized = false;
    initializing = false;
    constructor(options) {
        this.options = options;
        if (!options.width) {
            options.width = g_width;
        }
        if (!options.height) {
            options.height = g_height;
        }
    }
    async openPage(url, vp) {
        console.log("Browser: Opening url ", url);
        console.log("Browser: Getting existing pages.");
        const pagesBefore = await this.browser.pages();
        // url = url ?? '';
        if (!url) {
            url = 'about:blank';
        }
        url = url.toLowerCase();
        // Appending https to url.
        if (url.indexOf('https://') === -1 &&
            url.indexOf('http://') === -1 &&
            url.indexOf('chrome:') === -1 &&
            url.indexOf('file:') === -1) {
            url = 'https://' + url;
        }
        // pv-top-card-profile-picture__image
        // grep -R "This page doesn’t exist"
        console.log("Browser: Creating Chromeless");
        const chromeless = new Chromeless({
            launchChrome: false,
            waitTimeout: 20000
        });
        await Timeout.set(500);
        console.log('Browser: goto url ' + url);
        console.log('Browser: Pages before ', pagesBefore.map((x) => x.url()) /*, pagesBefore */);
        await chromeless.goto(url, 20000);
        await Timeout.set(500);
        const pagesAfter = await this.browser.pages();
        console.log('Browser: Pages after  ', pagesAfter.map((x) => x.url()));
        let page;
        pagesAfter.forEach((pageAfter, i) => {
            const afterId = pageAfter.mainFrame()._id;
            if (i < pagesBefore.length) {
                const pageBefore = pagesBefore[i];
                const beforeId = pageBefore.mainFrame()._id;
                // const urlBefore = pagesBefore[i].url();
                if (afterId === beforeId) {
                    // console.log("Tab #" + i + " is the same = " + x.url() );
                }
                else {
                    // console.log("Tab #" + i + " is diffirent. new = " + x.url() + "; old = " + urlBefore );
                    if (i === pagesAfter.length - 1) {
                        page = pagesAfter[i];
                        console.log('Browser: New page ' + page.url() + " on existing tab.");
                    }
                }
                console.log("Browser: Tab found with new page added ");
            }
            else {
                // Page
                console.log("Browser: Tab #" + i + " page added " + pageAfter.url() + ".");
                page = pageAfter;
            }
        });
        let cnt = 0;
        let navOk = false;
        let error = null;
        while (cnt++ < 5 && page && page.url() === 'about:blank') {
            console.log('Browser: Retrying #' + cnt + ' navigation to ' + url);
            if (!!(await page.goto(url).then((x) => {
                console.log('Browser: Done');
                navOk = true;
                return true;
            }).catch((err) => {
                console.error('Browser: Error', err.toString());
            }))) {
                console.log('Browser: Final');
                break;
            }
            await Timeout.set(1000);
        }
        if (!navOk) {
            error = 'failed to navigate to url ' + url;
            if (page) {
                console.log("Browser: Failed to navigate closing page");
                await page.close();
            }
        }
        else if (navOk) {
            if (page && setViewportWidthHeight) {
                await page.setViewport({ width: vp?.width ?? this.options.width, height: vp?.height ?? this.options.height });
            }
        }
        const pageInfo = page ? {
            id: page.mainFrame()._id,
            url: page.url()
        } : {
            id: null,
            url: null,
        };
        const browser = this;
        let ret;
        const release = () => {
            ret.inUse = false;
        };
        const contextScreenshot = async ({ fullPage: fullPage = true }) => {
            return browser.screenshot(ret.idx, fullPage);
        };
        const contextEval = async (param) => {
            return browser.eval(ret.idx, param);
        };
        const contextClose = async () => {
            return browser.closePageById(ret.id);
        };
        ret = {
            chromeless,
            page,
            id: pageInfo.id,
            pageInfo,
            error,
            url,
            inUse: true,
            age: new Date(),
            updated: new Date(),
            idx: this.pages.length,
            screenshot: contextScreenshot,
            eval: contextEval,
            close: contextClose,
        };
        this.pages.push(ret);
        return ret;
    }
    async getPages() {
        const pagesBefore = await this.browser.pages();
        return pagesBefore;
    }
    async showPage({ url, reuse, width, height }) {
        if (!this.initialized && !this.initialized && !this.options.lazy) {
            throw new Error('Not initialized and lazy initialize is not enabled.');
        }
        else if (!this.initialized && !this.initialized && this.options.lazy) {
            await this.initialize({ headless: true });
        }
        let timeout = 0;
        while (!this.initialized) {
            console.error("Waiting until initialised.");
            if (timeout++ > 30) {
                throw new Error('Not initialized after 30 seconds something is wrong.');
            }
            await Timeout.set(1000);
        }
        const context = await this.openPage(url, { width: width ?? this.options.width, height: height ?? this.options.height });
        return context;
    }
    async closePageById(id) {
        const ret = {
            closed: false,
        };
        const { browser } = this;
        const pages = await browser.pages();
        const k = pages.filter((x) => x.url() === 'about:blank');
        console.log('# ' + k.length);
        for (let i = 0; i < k.length; i++) {
            const page = k[i];
            if (page.mainFrame()._id === id) {
                await page.close();
                ret.closed = true;
            }
        }
        return ret;
    }
    async closeAllBlankPages() {
        console.log('Close all blank pages');
        const { browser } = this;
        let pagesTest = await browser.pages();
        const pages = await browser.pages();
        const k = pages.filter((x) => x.url() === 'about:blank');
        console.log('# ' + k.length);
        for (let i = 0; i < k.length; i++) {
            await k[i].close();
        }
        console.log('Done closing all blank pages.');
    }
    async screenshot(idx, fullPage = true) {
        if (typeof idx === 'object') {
            idx = idx.idx;
        }
        if (typeof idx !== 'number' || !Number.isFinite(idx) || idx < 0 || idx >= this.pages.length) {
            throw new Error('Invalid index');
        }
        let ctx;
        if (idx >= 0 && idx < this.pages.length) {
            if (!this.pages[idx]) {
                console.error("Error no page on index : " + idx);
            }
            ctx = this.pages[idx];
        }
        const page = ctx ? ctx.page : this.debuggerPage;
        let file = null;
        if (page) {
            const scr = await page.screenshot({ path: './image.png', type: 'png', fullPage });
            file = fs.readFileSync("./image.png");
            console.log("Browser: Done with screenshot");
        }
        else {
            console.error("Failed taking screenshow as there is no avilable page for index : " + idx);
        }
        return file;
    }
    async eval(idx, what) {
        console.log('Browser: Eval');
        if (typeof idx === 'object') {
            idx = idx.idx;
        }
        if (typeof idx !== 'number' || !Number.isFinite(idx) || idx < 0 || idx >= this.pages.length) {
            throw new Error('Invalid index');
        }
        let ctx;
        if (idx >= 0 && idx < this.pages.length && this.pages[idx]) {
            ctx = this.pages[idx];
        }
        return await ctx.chromeless.evaluate(what).wait(1000); // select the page tab to debug.
    }
    // Open the debugger and click a link.
    async openDebugger(linkTitle) {
        let { page, chromeless } = await this.openPage('http://localhost:9222/');
        await chromeless.evaluate(() => {
            let f;
            f = () => {
                const obj = document.querySelector('a[Title=' + linkTitle + ']');
                if (obj) {
                    obj.click();
                }
                else {
                    window.setTimeout(f, 100);
                }
            };
            f();
        }).wait(1000); // select the page tab to debug.
        return {
            page,
            chromeless
        };
    }
    async openExtensions(enableDevelopmentMode = true, activateDebugger = true) {
        let { page, chromeless } = await this.openPage('chrome://extensions/');
        await Timeout.set(250);
        // Activate developer mode..
        if (enableDevelopmentMode) {
            await chromeless.evaluate(() => {
                const toggleObj = document.querySelector("extensions-manager").shadowRoot
                    .querySelector("extensions-toolbar").shadowRoot
                    .querySelector("cr-toolbar").shadowRoot
                    .querySelector("slot").assignedElements()[0]
                    .querySelector("cr-toggle");
                if (toggleObj.getAttribute("aria-pressed") === "false") {
                    console.log("Development mode was off - toggling it.");
                    toggleObj.click();
                }
                else {
                    console.log('Development mode was on.');
                }
            });
            await Timeout.set(1000);
        }
        // Open the debugger page for extension;
        if (activateDebugger) {
            await chromeless.evaluate(() => {
                const tmp = document.querySelector("extensions-manager").shadowRoot
                    .querySelector("cr-view-manager#viewManager")
                    .querySelector('extensions-item-list').shadowRoot
                    .querySelector("extensions-item").shadowRoot
                    .querySelector("a[title='background page']");
                if (tmp) {
                    tmp.click();
                }
                else {
                    console.error('Cannot find background page link');
                }
            }).wait(1000); // select the page tab to debug.
        }
        return {
            page,
            chromeless
        };
    }
    async initialize({ headless: headless = false }) {
        console.log('Browser: initializing');
        if (this.initialized) {
            throw new Error('Already initialized');
        }
        if (this.initializing) {
            throw new Error('Already initializing');
        }
        this.initializing = true;
        const pathToExtension = ''; // set this to something to load an extension.
        // const pathToExtension = process.cwd() + '/dist-ext';
        // await loadExt();
        if (pathToExtension && !fs.existsSync(pathToExtension)) {
            throw new Error('Extension doesn\'t exist : ' + pathToExtension);
        }
        const userDataPath = 'user-data';
        if (pathToExtension) {
            console.log("Opening Chrome. loading ext ", pathToExtension);
        }
        let executablePath = process.env.EXEC_PATH ?? undefined;
        if (!executablePath && !!process.env.EXEC_PATH_RESOLVE) {
            executablePath = ['linux', 'freebsd', 'openbsd'].indexOf(process.platform.toLowerCase()) >= 0 ?
                '/usr/bin/google-chrome'
                :
                    process.platform.toLowerCase() === 'darwin' ?
                        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                        :
                            undefined;
        }
        if (executablePath && !fs.existsSync(executablePath)) {
            console.error("Chromium executeable didn't exists: " + executablePath);
            executablePath = undefined;
        }
        const args = [
            // `--no-sandbox`,
            // `--disable-setuid-sandbox`,
            `--disable-gpu`,
            `--start-maximized`,
            ...(pathToExtension ? [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`
            ] : []),
            `--window-size=${this.options.width},${this.options.height}`,
            `--user-data-dir=${userDataPath}`,
            `--remote-debugging-address=0.0.0.0`,
            `--remote-debugging-port=9222`,
            `--disable-infobars`,
            // `--disable-web-security`,
            // `--disable-site-isolation-trials`
            // `--start-fullscreen`
        ];
        const browser = this.browser = await puppeteer.launch({
            headless,
            defaultViewport: null,
            ignoreHTTPSErrors: true,
            executablePath,
            ignoreDefaultArgs: ["--enable-automation"],
            args
        });
        await Timeout.set(3000);
        console.log("Browser: Opening Chrome...done");
        // const {page, chromeless} = await this.openDebugger();
        // this.debuggerPage = page;
        // this.debuggerChromeless = chromeless;
        // await Timeout.set(1000);
        // await this.openExtensions(true, false);
        // await Timeout.set(1000);
        // Close initial blank page.
        await this.closeAllBlankPages();
        this.initialized = true;
        this.initializing = false;
        console.log('Browser: initialized');
    }
}
