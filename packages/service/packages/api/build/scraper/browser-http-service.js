import express from 'express';
export class BrowserHttpService {
    port = Number.parseInt(process.env.BROWSER_PORT ?? '3003');
    getInterfaceUrl() {
        return 'localhost:' + this.port + "/status";
    }
    async start(browser) {
        const app = express();
        const port = this.port;
        app.get('/chrome/new-page', async (req, res) => {
            if (req.query.url) {
                const ret = await browser.showPage(req.query.url);
                if (ret.error) {
                    res.send(JSON.stringify({ error: ret.error }));
                    return;
                }
                res.send(JSON.stringify(ret.pageInfo || {}, undefined, ' '));
                return;
            }
            res.send(JSON.stringify({ error: 'no url' }, undefined, ' '));
        });
        app.get('/chrome/new', async (req, res) => {
            const url = req.query.url;
            if (!url) {
                res.send(JSON.stringify({ error: 'no url' }, undefined, ' '));
                return;
            }
            const context = await browser.showPage({ url, reuse: false, });
            const data = await context.screenshot({ fullPage: false });
            res.setHeader('Content-Type', 'image/png');
            res.send(data);
        });
        app.get('/chrome/close-page', async (req, res) => {
            if (!req.query.id) {
                res.send(JSON.stringify({ error: 'no id' }, undefined, ' '));
                return;
            }
            const ret = await browser.closePageById(req.query.id);
            //DockerHost.sendMessage( {method: 'start-bot'} );
            res.send(JSON.stringify(ret || {}, undefined, '  '));
        });
        app.get('/chrome/pages', async (req, res) => {
            const pages = await browser.getPages();
            const ret = pages.map((x, index) => ({
                index,
                id: x.mainFrame()._id,
                url: x.url(),
            })).sort((a, b) => a.index > b.index ? 1 : -1);
            res.send(JSON.stringify(ret, undefined, '  '));
        });
        app.get('/chrome/status', async (req, res) => {
            res.send({
                status: 'ok'
            });
        });
        app.get('/chrome/screenshot/:id', async (req, res) => {
            let id = Number.parseInt(req.params && req.params.id ? req.params.id : '0');
            const screenshot = await browser.screenshot(Number.isFinite(id) ? id : 0);
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': screenshot.length
            });
            res.end(screenshot);
        });
        app.listen(port, () => console.log(`Example app listening on http://localhost:${port}!`));
    }
}
