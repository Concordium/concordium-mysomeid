import {
  Express,
  Request,
  Response
} from 'express';
const request = require('request');
import fetch from 'node-fetch';

export default (app: Express) => {

  app.get('/proxy', async (req: Request<{}, {}, {}, {url: string}>, res: Response) => {
    try {
      fetch(decodeURIComponent(req.query.url)).then(actual => {
        actual.headers.forEach((v, n) => res.setHeader(n, v));
        actual.body?.pipe(res);
      });
    } catch(e) {
      res.status(500).json({error: 'Unknown server error'});
    }
  });

};
