import { validateQR } from "./validate-qr";

export const fetchQRFromImageUrls = async (urls: string[]): Promise<any> => {
  for ( let url of urls ) {
    try {
      const imageRes = await validateQR({url});
      if ( imageRes ) {
        return {
          url,
          result: imageRes
        };
      }
    } catch(e) {
      console.error(e);
    }
  }
  return null;
}