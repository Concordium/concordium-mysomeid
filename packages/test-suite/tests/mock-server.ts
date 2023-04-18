import {
  createLinkedInMock,
  createTunnel,
  setLinkedInHost,
} from './utils';

(async () => {
  // setLinkedInHost();
  await createLinkedInMock();  
  const tunnel = await createTunnel(80);
  
})().then().catch(console.error);


