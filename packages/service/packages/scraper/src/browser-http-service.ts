import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';

const TIMEOUT_MS = 60000 * 5;
const UPDATE_INTERVAL = 5000;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN ?? '020db892-f6d7-42ed-b538-d6f341fdebb0';
const COLLECTOR = process.env.COLLECTOR ?? 'c_leh7vkth1mjr6dt2v8';

class Context {
  id: string;
  url: string;
  platform: 'li';
  userId: string;
  status: 'in-progress' | 'opening' | 'done' | 'error';
  error: string;
  refId?: string;
  ts: number;
  lastUpdated: number;
  result?: any = null;
};

const contexts: Record<string, Context> = {};

export class BrowserHttpService {
  // port = Number.parseInt(process.env.SCRAPER_PORT ?? '3003');

  constructor(private port: number = 3003) {
  }

  public async start() {
    const app: express.Application = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));
    app.use(cors());

    const port: number = this.port;
    
    app.get('/health', async (req, res) => {
      res.status(200).json({
      });
    });
    
    let heartbeat: () => void | undefined;
    heartbeat = () => {
      const inProgress = Object.entries(contexts).filter(x => x[1].status === 'in-progress');
      inProgress.forEach(([id, ctx]) => {
        if ( !ctx?.refId ) {
          console.error("Invalid context");
          return;
        }
        if ( new Date().getTime() - ctx?.ts > TIMEOUT_MS ) {
          ctx.status = 'error';
          ctx.error = "timeout";
          return;
        }

        if ( new Date().getTime() - ctx.lastUpdated < UPDATE_INTERVAL ) {
          return;
        }

        console.log("updating ", id);
        const url = "https://api.brightdata.com/dca/get_result?response_id=" + ctx.refId;
        ctx.lastUpdated = new Date().getTime();
        fetch(url, {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + ACCESS_TOKEN,
          },
        })
        .then(response => {
          // console.log("response.status ", response.status );
          if( response.status < 200 || response.status > 299 )
            throw new Error('Invalid response');
          return response.json();
        })
        .then(body => {
          console.log("status ", body );
          if ( body.pending ) {
            // console.log("Request is pending");
            return;
          }
          console.log("scrape job is done.");
          if ( Array.isArray(body) ) {
            ctx.result = body[0];
            ctx.status = 'done';
          } else {
            ctx.result = body;
            ctx.status = 'done';              
          }
        })
        .catch(err => {
          console.error("Heartbeat error", err);
        });
      });
    };
    setInterval(heartbeat, 1000);

    app.get('/linked-in/profile', async (req: Request<{}, {}, {}, {url: string, incognito: string}>, res) => {
      try {
        if ( !req.query.url ) {
          res.send( JSON.stringify({error: 'no url'}, undefined, ' ') );  
          return;
        }
        const url = decodeURIComponent(req.query.url.toString()); 
        if ( url.indexOf('linkedin.com') === -1 ) {
          throw new Error('Not a linkedin url');
        }

        const comps = url.split('/');
        const userId = url.endsWith('/') ? comps[comps.length-2] : comps[comps.length-1];

        const ctx: Context = new Context();
        ctx.id = Math.round(Math.random()*999999999999).toString();
        ctx.platform = 'li';
        ctx.userId = userId;
        ctx.url = url;
        ctx.status = "opening";
        ctx.error = '';
        ctx.result = null;
        ctx.ts = new Date().getTime();
        ctx.lastUpdated = new Date().getTime();
        contexts[ctx.id] = ctx;

        fetch('https://api.brightdata.com/dca/trigger_immediate?collector=' + COLLECTOR, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: userId
          }),
        })
        .then(response => {
          // console.log("scraper response " + response.status);
          if( response.status < 200 || response.status > 299 )
            throw new Error('Invalid response');
          return response.json();
        })
        .then(body => {
          ctx.status = 'in-progress';
          ctx.refId = body.response_id;
        })
        .catch(e => {
          console.error(e);
          ctx.status = 'error';
          ctx.error = "Error: ";
        });

        res.status(200).json(ctx);
      } catch(e) {
        console.error(e);
        res.status(500).json({error: (e as any)?.message ?? 'unknown'});   
      }
    });

    app.get('/context/:id', async (req: Request<{id: string}, {}, {}, {}>, res) => {
      try {
        const id = req.params.id;
        if ( id == null || id === undefined ) {
          throw new Error('No id');
        }

        const entry = contexts[id];
        
        if ( !entry ) { 
          res.status(200).json({});
          return;
        }

        res.status(200).json(entry);
      } catch(e) {
        console.error(e);
        res.status(500).json({error: (e as any)?.message ?? 'unknown'});   
      }
    });

    app.post('/linked-in/profile/web-hook', async (req: Request<{}, {}, {response_id?: string}, {}>, res) => {
      try {
        // console.log("Webhook POST", {hdr: req.headers, body: req.body});
        if ( req.headers.authorization !== 'Hey-Dude' ) {
          throw new Error('Unauthorised');
        }
        const responseId = req.headers['dca-response-id']
        if (!responseId ) {
          throw new Error('No response id!');
        }
        const entry = Object.entries(contexts).find(x => x?.[1]?.refId === responseId);
        if ( entry ) {
          entry[1].result = (req.body as any)[0];
          entry[1].status = 'done';
        }
        res.status(200).json({});
        return;
      } catch(e) {
        console.error(e);
        res.status(500).json({error: (e as any)?.message ?? 'unknown'});   
      }
    });

    app.listen(port, () => console.log(`Scraper HTTP Service: Listening on http://localhost:${port}`));
  }
}