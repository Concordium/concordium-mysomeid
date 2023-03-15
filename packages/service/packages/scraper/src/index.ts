import {
  BrowserHttpService,
} from './browser-http-service';

async function main() {
  const port = Number.parseInt(process.env.SCRAPER_PORT ?? '3003');
  const service = new BrowserHttpService(port);
  await service.start();
}

main().then().catch(e => {
  console.error(e);
  process.exit(-1);
});

