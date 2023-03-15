const Jimp = require("jimp");
const QrCodeReader = require('qrcode-reader');
export const fetchQRFromImageUrls = async (urls) => {
    for (let url of urls) {
        const imageRes = await fetchQRFromImage(url);
        if (imageRes) {
            return {
                url,
                result: imageRes
            };
        }
    }
    return null;
};
export const fetchQRFromImage = async (url) => {
    try {
        return new Promise((resolve, reject) => {
            Jimp.read(url, (err, image) => {
                if (err) {
                    console.error(err);
                }
                let qrReader = new QrCodeReader();
                qrReader.callback = (err, value) => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(value?.result ?? null);
                };
                qrReader.decode(image.bitmap);
            });
        });
    }
    catch (e) {
        console.error("Failed validating image at url " + url, e);
        return null;
    }
};
