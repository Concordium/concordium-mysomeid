import {
  Express,
  Request,
  Response
} from 'express';
import { validateQR } from './validate-qr';
const request = require('request');

export default (app: Express) => {

  /*app.post('/qr/validate-embedded', async (req, res) => {
    try {
      const {
        imageData,
        data
      } = await new Promise<any>((resolve: any, reject: any) => {
        const data = Buffer.from( req.body, 'base64' );
        Jimp.read(data, (err: Error | null, image) => {
          err && reject(err);
          !err && image.getBuffer(Jimp.MIME_JPEG, (err: Error | null, buffer: Buffer) => {
            err && reject(err);
            !err && resolve({
              imageData: image.bitmap,
              data: undefined,
            });
          });
        });
      });
  
      const value: any = await (new Promise((resolve, reject) => {
        const qr = new QrCode();
        qr.callback = (err: any, v: any) => err != null ? reject(err) : resolve(v);
        qr.decode(imageData, data);
      }));
  
      res && res.json({result: value.result});
      res = undefined as any as Response<any, Record<string, any>>;

    } catch(e) {
      console.error(e);
      res && res.status(500).json({error: 'Unknown server error'});
    }
  }); */

  // fail: http://localhost:4200/qr/validate?url=https%3A%2F%2Fmedia.licdn.com%2Fdms%2Fimage%2FD5616AQFe43wsJD1WjQ%2Fprofile-displaybackgroundimage-shrink_350_1400%2F0%2F1674714039044%3Fe%3D1680134400%26v%3Dbeta%26t%3D1HBUCalhomYuQcU5g713yT-QIwGvKoxRg5WMHq4p0Bk
  // ok: http://localhost:4200/qr/validate?url=https%3A%2F%2Fmedia.licdn.com%2Fdms%2Fimage%2FD5616AQFIORb2LEKt8Q%2Fprofile-displaybackgroundimage-shrink_350_1400%2F0%2F1674713573126%3Fe%3D1680134400%26v%3Dbeta%26t%3DBEsIgOLJlxhZP4WKYK_8-7a6ukAVxLLBoEUHsCbnSJM
  const scanImageForQRCodeRequest = async (req: Request<{}, {}, {}, {url?: string, urls?: string}>, res: Response) => {
    try {
      const {
        url,
        urls,
      } = req.query;
  
      if ( !url && !urls ) {
        res.status(500).json({error: 'No url(s) given'});
        return;
      }

      if ( url ) {
        const decodedUrl = decodeURIComponent(`${url}`);
        console.log("Validating url " + decodedUrl);
        const result = await validateQR({url: decodedUrl});
        res.json({result});
        return;

      } else if ( urls ) {
        const decodedUrls = decodeURIComponent(`${urls}`).split('|');
        for (let i=0; i<decodedUrls.length; i++) {
          const decodedUrl = decodedUrls[i];
          const result = await validateQR({url: decodedUrl});
          if ( result ) {
            res.json({result});
            return;
          }
        }        
      }

      res.json({result: null});
    } catch(e) {
      res && res.status(500).json({error: 'Unknown server error'});
    }
  };
  app.get('/qr/validate', scanImageForQRCodeRequest);
  app.get('/qr/image/scan', scanImageForQRCodeRequest);

};
