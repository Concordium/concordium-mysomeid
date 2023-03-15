import http from 'http';
import express from 'express';
import path from 'path';

export function testServer() {
    const app = express();
    // default URL for website
    app.use('/', (_: any, res: any) => {
        // console.log("asdsada");
        res.sendFile(path.join(__dirname, 'index.html'));
    });
    const server = http.createServer(app);
    server.listen(5001);
    console.debug('Server listening http://localhost:5001');        
    return {
        stop: async () => {
            server.close();
        }
    }
}