// import puppeteer, { Page, Browser, Frame } from 'puppeteer'; // import Puppeteer
// import * as path from 'path';
import * as express from 'express';
const Jimp = require('jimp');
const axios = require('axios');

import {
  // sleep,
  createTunnel,
} from '../utils';

import {
  apiBaseUrl 
} from '../config';

describe('QRCode tests', () => {
  let tunnel;
  let app;
  let server;
  beforeAll(async () => {
    tunnel = await createTunnel(6002);
    // console.log('tunnel.url ', tunnel.url);
    app = express();
    app.get('/bg/:id', (req, res) => {
      const id = req.params.id;
      if  (id < 1 || id > 6 ) {
        throw new Error('Invalid id');
      } 
      Jimp.read(`images/bg-${id}.png`)
        .then(image => {
          return image.resize(800, Jimp.AUTO) // specify the width and maintain aspect ratio for height
            .quality(80) // set the JPEG quality
            .write('output.jpg'); // save as a JPEG             
        })
        .then(image => {
          // serve the image as a response
          res.set('Content-Type', 'image/jpeg');
          image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            res.send(buffer);
          });
        })
        .catch(err => {
          console.error(err);
          res.status(500).send('Error loading image');
        });
    });
    app.get('/bg/:id/:quality/:width/qr', (req, res) => {
      let {
        quality,
        id,
        width,
      } = req.params;
      Jimp.read(`images/bg-${id}-qr.png`)
        .then(image => {
          return image.resize(parseInt(width), Jimp.AUTO) // specify the width and maintain aspect ratio for height
            .quality(parseInt(quality)) // set the JPEG quality
            .write('output.jpg'); // save as a JPEG             
        })
        .then(image => {
          // serve the image as a response
          res.set('Content-Type', 'image/jpeg');
          image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            res.send(buffer);
          });
        })
        .catch(err => {
          console.error(err);
          res.status(500).send('Error loading image');
        });
    });
    await new Promise<void>(resolve => {
      server = app.listen(6002, () => {
        console.log('Server started on port 6002');
        resolve();
      });
    })
  });

  afterAll(async () => {
    tunnel?.close();
    server?.close();
  });

  // Create 6 tests to show that it will not find the QR code in a specific image.
  // for ( let i=0; i<=6; i++ ) {
  it(`Will return a valid negative result for image at image/bg-1.png with no QR embedded`, async () => {
    expect(server).toBeDefined();
    const imageUrl = tunnel.url + '/bg/1';   
    const url = `${apiBaseUrl}/v1/qr/validate?url=${encodeURIComponent(imageUrl)}`;
    // console.log("url ", url);
    // console.log("calling url ", url, ' imageUrl ', imageUrl);
    const response = await axios.get(url);
    // console.log("response" , response.data);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    // Since the image contains some random data from the internet with no QR we should get null as result.
    expect(response.data.result).toBe(null);
  }, 30000);

  const tests: ((number | boolean)[])[] = [
    [1, 80, 1000, true],
    [1, 80, 800, true],
    [1, 80, 600, true],
    [1, 80, 500, true],
    [1, 80, 300, false],

    [1, 60, 800, true],
    [1, 60, 500, true],
    [1, 60, 300, false],

    [1, 45, 800, true],
    [1, 45, 500, true],
    [1, 45, 300, false],

    [1, 35, 800, true],
    [1, 35, 500, true],
    [1, 35, 300, false],

    // Image 2
    [2, 80, 800, true],
    [3, 80, 800, true],
    [4, 80, 800, true],
    [5, 80, 800, true],
    [6, 80, 800, true],

    // Image 2
    [2, 50, 600, true],
    [3, 50, 600, true],
    [4, 50, 600, true],
    [5, 50, 600, true],
    [6, 50, 600, true],
  ];  
  for ( let [img, quality, width, willSucceed] of tests ) {
    it(`Will return the decoded QR code for a JPEG image ${img} with a QR embedded downscaled to ${width} x <aspect-height> and quality ${quality}`, async () => {
      expect(server).toBeDefined();
      const imageUrl = `${tunnel.url}/bg/${img}/${quality}/${width}/qr`;
      const url = `${apiBaseUrl}/v1/qr/validate?url=${encodeURIComponent(imageUrl)}`;
      let response;
      try {
        response = await axios.get(url);
      } catch(e) {
        console.error(e);
        throw e;
      }
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.result).toBe(willSucceed ? 'https://app.mysomeid.dev/v/PuKBjRT1' : null);
    }, 30000);
  }

});
