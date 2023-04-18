const localtunnel = require('localtunnel');

let inst;
export async function createTunnel(port: number = 6000) {
  if ( inst ) {
    return inst;
  }
  let tunnel = await localtunnel({ port });
  inst = {
    tunnel,
    url: tunnel.url,
    close: async () => {
      return new Promise<void>(resolve => {
        tunnel.on('close', () => {
          tunnel = null;
          inst = null;
          resolve();
        });
        tunnel?.close();
      });
    },
  };
  return inst;
}
