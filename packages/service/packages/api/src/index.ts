import dotenv from 'dotenv';
dotenv.config();
import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import {
  CryptographicParameters,
  HttpProvider,
  IdStatement,
  JsonRpcClient,
} from '@concordium/node-sdk';
import proofAPI from './proof-api';
import qrAPI from './qr-api';
import {
  getStatement
} from './statement';
import platformsAPI from './platforms-api';
import proxyAPI from './proxy-api';
// import db from './db';

/*(async () => {
  const id = "vvv" + Math.round(Math.random()*9999999);
  await db.insertProof(id, "li", "ggg", "first", "Last", "");
  db.getProof(id).then(p => console.log(p)).catch(console.error);  
})().then(() => {
  console.log("ok")
}).catch(console.error);*/

const client = new JsonRpcClient(new HttpProvider(process.env.CCD_JSON_RPC_URL ?? "https://json-rpc.testnet.concordium.com"));

const state = (() => {
  let tokens: string[] = [];
  let globalContext: CryptographicParameters;

  const statement: IdStatement = getStatement();

  const init = async () => {
    const response = await client.getCryptographicParameters();
    if ( !response?.value ) {
      throw new Error('Failed to fetch crypto params.');
    }
    globalContext = response?.value;
    console.log("cryptoParams ", globalContext);
  };

  return () => ({
    init,
    tokens,
    globalContext,
    statement,
  });
})();

const app: Express = express();
const port = process.env.PORT ?? 4200;

app.use(cors());

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '2mb',
}));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.text({ limit: '2mb' }));

app.use(rateLimit({
	windowMs: 60 * 1000, // 1 min
	max: 500, // 500 requests / min
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}));

app.get('/', (req: Request, res: Response) => {
  res.json({});
});

app.get('/health', (req: Request, res: Response) => {
  res.json({});
});

qrAPI(app);

proofAPI(app);

platformsAPI(app);

proxyAPI(app);

(async () => {
  console.log('⚡️[server]: initializing state');
  await state().init();

  console.log('⚡️[server]: Starting Http REST API');
  app.listen(port, () => {
    console.log(`⚡️[server]: API is served at http://localhost:${port}`);
  });  
})().catch(e => {
  console.error(e);
  process.exit(-1);
});
