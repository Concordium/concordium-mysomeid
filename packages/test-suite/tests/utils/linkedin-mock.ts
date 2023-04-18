const path = require('path');
const express = require('express');
// const axios = require('axios');
const Jimp = require('jimp');
const fs = require('fs');
const https = require('https');
const http = require('http');
const multer = require('multer');

export async function createLinkedInMock(profileImageUrl?: string, portHttp = 80, portHttps = 443) {
  const app = express();
  let otherProfileText = '';
  let serverHttp: any;
  let serverHttps: any;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

  const upload = multer({ storage: storage });

  const setBackgroundPathInOtherProfile = (s: string) => {
    console.log('setBackgroundPathInOtherProfile ', s);
    const fn = path.resolve('mock-linkedin-pages/linkedin-other-profile-page.html');
    let content = fs.readFileSync(fn, { encoding: 'utf-8' });
    content = content.replace(`src="https://media.licdn.com/dms/image/D4D16AQEymP_aZB8Iew/profile-displaybackgroundimage-shrink_350_1400/0/1677571563449?e=1685577600&v=beta&t=G6Twq78g_3ANXtRiwTD-C74Vb98dmzkBim4tpMnFlto" style`, `src="${s}" style`);
    otherProfileText = content;
  };

  // overwrite picture url.
  if (profileImageUrl) {
    setBackgroundPathInOtherProfile(profileImageUrl);
  }

  app.get('/', (req, res) => {
    res.redirect('feed/');
  });

  app.get('/feed/', (_req, res) => {
    res.sendFile(path.resolve('mock-linkedin-pages/linkedin-own-profile-feed.html'));
  });

  app.get('/in/kristian-mortensen-66bb291/', function (_req, res) {
    res.sendFile(path.resolve('mock-linkedin-pages/linkedin-own-profile-page.html'));
  });

  app.get('/in/john-doe-123456/', function (_req, res) {
    if (otherProfileText) {
      res.send(otherProfileText);
      return;
    }
    res.sendFile(path.resolve('mock-linkedin-pages/linkedin-other-profile-page.html'));
  });

  app.get('/in/mjmjmj/', function (_req, res) {
    if (otherProfileText) {
      res.send(otherProfileText);
      return;
    }
    res.sendFile(path.resolve('mock-linkedin-pages/linkedin-other-profile-page.html'));
  });

  app.get('/image', function (_req, res) {
    Jimp.read(path.resolve('mock-linkedin-pages/1677571563449.jpg'))
      .then(image => {
        res.set('Content-Type', 'image/jpeg');
        image.getBuffer(Jimp.MIME_JPEG, (_err, buffer) => {
          res.send(buffer);
        });
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error loading image');
      });
  });

  let uploadedFile;

  app.post('/upload', upload.single('image'), (req, res) => {
    console.log("POST /upload");
    uploadedFile = req.file.path;
    console.log('uploaded file : ' + uploadedFile);
    if (req.file) {
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        file: req.file,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Image upload failed',
      });
    }
  });

  app.get('/last-uploaded-image', (_req, res) => {
    Jimp.read(uploadedFile)
      .then(image => {
        res.set('Content-Type', 'image/jpeg');
        image.getBuffer(Jimp.MIME_JPEG, (_err, buffer) => {
          res.send(buffer);
        });
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error loading image');
      });
  });

  // Read the SSL/TLS certificate and private key
  

  const privateKey = fs.readFileSync(path.resolve('certs/selfsigned.key'), 'utf8');
  const certificate = fs.readFileSync(path.resolve('certs/selfsigned.crt'), 'utf8');

  const httpServer = http.createServer(app);
  const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);

  console.log('waiting for server to start');
  await Promise.all([
    new Promise<void>(resolve => {
      serverHttp = httpServer.listen(portHttp, () => {
        console.log('Http server started on port ' + portHttp);
        resolve();
      });
    }),
    new Promise<void>(resolve => {
      serverHttps = httpsServer.listen(portHttps, () => {
        console.log('Https server started on port ' + portHttps);
        resolve();
      });
    })
  ]);

  profileImageUrl && await new Promise<void>((resolve, reject) => {
    Jimp.read(profileImageUrl)
      .then(_image => {
        // console.log("IMAGE READ");
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });

  return {
    close: () => {
      serverHttp?.close();
      serverHttps?.close();
    },
    setBackgroundPathInOtherProfile,
  };
}
