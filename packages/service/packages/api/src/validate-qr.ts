import {
  exec,
  ExecException,
} from 'child_process';
import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';
import {trimString} from './utils/trim-string';
const QrCodeReader = require('qrcode-reader');
const QrCode = require('qrcode-reader');

type ValidateQR = {
  url: string;
};

// Try 3 methods to get the QR code from a picture.
export async function validateQR ({url}: ValidateQR): Promise<string | null> {
  if ( !url ) {
    throw new Error('No url');
  }

  console.log("validateQR ", url);

  const image = await (new Promise<Jimp>((resolve, reject) => {
    Jimp.read(url, (err: any, image: Jimp) => {
      if (err) {
        console.error('Error Reading at url : ' + url, ' Error ', err);
        reject(err);
        return;
      }
      resolve(image);
    });  
  }));
  
  if ( !image ) {
    throw new Error('No image');
  }

  const ext = image.getMIME()?.split('/')?.[1];
  const tmpFileName = 'tmp-img';
  const fn = path.join(process.cwd(), `${tmpFileName}.${ext}`);

  await (new Promise<void>((resolve, reject) => {
    image.write(fn, (err: any) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve();
    });
  }));

  const zbarImgCmd = fs.existsSync('/usr/bin/zbarimg')
                        ? '/usr/bin/zbarimg'
                        : fs.existsSync('/opt/homebrew/bin/zbarimg')
                          ? '/opt/homebrew/bin/zbarimg'
                          : path.join(process.cwd(), 'zbarimg') // local located. 

  const qrResult1 = await (new Promise<string|null>(resolve => {
    const cmd = zbarImgCmd + ' -q ' + fn;

    console.log("Running : " + cmd);
    exec(cmd, (error: ExecException | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        resolve(null);
  
        return;
      }
  
      const delim = 'QR-Code:';
      const resultFound = stdout.indexOf(delim) >= 0;
      if ( !resultFound ) {
        console.log(`Verify cmd: stdout: ${stdout}`);
        console.error(`Verify cmd: stderr: ${stderr}`);
  
        resolve(null);
        return;
      }
  
      const comps = stdout.split(delim);
      const qrCode = trimString((comps[comps.length-1] ?? ''), ' \n\t');
  
      resolve(qrCode);
    });
  }));

  const qrResult2 = await (new Promise<string | null>((resolve, reject) => {
    try {
      const qrReader = new QrCodeReader();
      qrReader.callback = (err: any, value: { result: any; }) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(value?.result ?? null);
      };
      qrReader.decode(image?.bitmap);
    } catch(e) {
      console.error(e);
      reject(e);
    }  
  }));

  const qrResult3 = await (async () => {
    try {
      const {
        imageData,
        data
      } = await new Promise<any>((resolve: any, reject: any) => {
        Jimp.read(url, (err: Error | null, image) => {
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
    
      return value?.result ?? null;
    } catch(e) {
      if ( `${e}`.indexOf("Couldn't find enough finder patterns") >= 0 ) {
        return null;
      }
      console.error('Caught exception', `${e}`);
      throw new Error('Caught exception: ' + `${e}`);
    }    
  })().then().catch(console.error);

  console.log({qrResult1, qrResult2, qrResult3});

  const result = qrResult1 ?? qrResult2 ?? qrResult3 ?? null;
  console.log("Final result ", result );
  return result;
}
