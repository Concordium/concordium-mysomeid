import {
  Express,
  Request,
  Response
} from 'express';
import {
  fetchQRFromImageUrls,
} from './fetch-image-from-url';
import rateLimit from 'express-rate-limit';
import {
  getScraper,
} from './scraper';
import taskManager from './task-manager';
import createTaskFetchLinkedInProfileDataV2, {FetchLinkedInProfileTaskV2} from './task-fetch-linkedin-profile-data-ver2';
import createTaskDummyValidateProfile, {TaskDummyValidateProfile} from './task-dummy-validate-profile';
import { isLinkedInProfileUrl } from './utils/url';

function ratePerMin(n: number) {
  return rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: n, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
}

export default (app: Express) => {
  const scraper = getScraper();

  // Test
  // OK: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/D4E16AQFVBt9a2DGNVw/profile-displaybackgroundimage-shrink_350_1400/0/1670391545559?e=1675900800&v=beta&t=wCxvt-suzHjWdycQPFzHsGK75cLzgbBViqiQUdEcRTQ"]}' 127.0.0.1:4200/platform/validate-image-url
  // Fail: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/C5603AQEUWqNnctVw9A/profile-displayphoto-shrink_800_800/0/1661394116755?e=1675900800&v=beta&t=SnSlXB1L57hj3IHKOJ0TK2PRuf1qM2zVqjfq8hJ5UtI"]}' 127.0.0.1:4200/platform/validate-image-url
  // Ok 2: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/C5603AQEUWqNnctVw9A/profile-displayphoto-shrink_800_800/0/1661394116755?e=1675900800&v=beta&t=SnSlXB1L57hj3IHKOJ0TK2PRuf1qM2zVqjfq8hJ5UtI", "https://media-exp1.licdn.com/dms/image/D4E16AQFVBt9a2DGNVw/profile-displaybackgroundimage-shrink_350_1400/0/1670391545559?e=1675900800&v=beta&t=wCxvt-suzHjWdycQPFzHsGK75cLzgbBViqiQUdEcRTQ"]}' 127.0.0.1:4200/platform/validate-image-url
  app.post("/platform/validate-image-url", ratePerMin(30), async (req: Request, res: Response) => {
    try {
      const urls = req.body.urls;
      const firstPosRes = await fetchQRFromImageUrls(urls);
      if ( firstPosRes ) {
        res.json({
          url: firstPosRes.url,
          result: firstPosRes.result,
        });
        return;
      }
      res.json({
        url: null,
        result: null,
      });
    } catch(e) {
      console.error(e);
      res.status(500).json({error: 'Internal server error'});
    }
  });

  function sendScraperStatus(res: Response, context: FetchLinkedInProfileTaskV2) {
    res.json({
      id: context.id,
      status: context.status ?? null,
      profileExists: context.profileExists,
      profileInfo: context.profileInfo,
      url: context.url,
      // currentLocation: context.currentLocation,
      // screenshot: context.screenshot,
    });
  }
  
  app.get("/platform/profile-info/:id/status", ratePerMin(2000), async (req: Request<{}, {}, {}, {p: string, id: string}>, res: Response) => {
    const contextId = (req.params as any).id;
    if  (!contextId ) {
      res.status(500).json({code: 500, error: 'internal server error'});
      return;
    }

    const context = taskManager.get(contextId);
    if ( !context ) {
      res.status(500).json({code: 500, error: 'internal server error'});
      return;
    }

    sendScraperStatus(res, context);
  });

  const profileInfoRequest = async (req: Request<{}, {}, {}, {p?: string, id?: string, url?: string}>, res: Response) => {
    try {
      const {
        p,
        id,
        url: _url,
      } = req.query;
  
      let url: string;
      if (!_url) {
        if ( !id ) {
          console.log("Invalid parameter id(name) ", id );
          res.status(500).json({error: 'Invalid name argument'});
          return;
        }
      
        if( ['li'].indexOf((p ?? '').toLowerCase()) === -1 ) {
          console.log("Invalid parameter platform, ", p );
          res.status(500).json({error: 'Invalid platform argument'});
          return;
        }

        url = `https://www.linkedin.com/in/${id}/`; 
      } else {
        url = decodeURIComponent(_url);

        if (!url || !isLinkedInProfileUrl(url)) {
          res.status(500).json({error: 'Invalid url argument - not a linkedin profile url'});

          return;
        }
      }

      const task = await createTaskFetchLinkedInProfileDataV2({
        url,
        scraper,
      });

      taskManager.run(task);

      console.log("Created context ", task);
        
      sendScraperStatus(res, task);
    } catch(e) {
      console.error(e);
      res.status(500).json({error: 'Internal server error'});   
    }
  };

  // This currently only works for linked-in.
  app.get("/oracle/profile-info", ratePerMin(60), profileInfoRequest);
  app.get("/platform/profile-info", ratePerMin(60), profileInfoRequest);

  
};
