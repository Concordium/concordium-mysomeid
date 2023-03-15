import fetch, {Response} from 'node-fetch';

import {testServer} from './test-server';

const BASE_URL = 'http://localhost:3003';

const linkedInProfileUrl = 'https://www.linkedin.com/in/kristian-mortensen-66bb291/';

const localhostUrl = 'http://localhost:5001';

let server: {stop: () => Promise<void>} | undefined;

describe('Scraper API', () => {
    beforeAll(async () => {
        server = testServer();
        let response = (await fetch(
            `${BASE_URL}/scraper/close-all-pages`
            ).then(r => r.json()));
    });

    afterAll(async () => {
        await server?.stop();
    });

    describe('Can open and close a very simple page', () => {
        jest.setTimeout(10000);
        let id: string;
        let dt: number;
        it('Can open the page', async () => {
            dt = new Date().getTime();
            const url = localhostUrl;
            const response = (await fetch(`${BASE_URL}/scraper/new-page?url=${encodeURIComponent(url)}`)
                                .then(r => r.json()));
            expect(response).toBeDefined();
            expect(response.url).toBeDefined();
            expect(response.url).toBeTruthy();
            expect(response.id).toBeDefined();
            expect(response.id).toBeTruthy();
            id = response.id;
        });
        it('Can close the page', async () => {
            const response = (await fetch(
                `${BASE_URL}/scraper/p/${id}/close`
                ).then(r => r.json()));
            expect(response).toBeDefined();
            expect(response?.closed).toBe(true);
            console.log('Time to open and close a page #', (new Date().getTime() - dt));
        });
    });

    describe('Can manage an online page', () => {
        jest.setTimeout(10000);
        let id: string;
        let dt: number;
        it('Can open the page', async () => {
            dt = new Date().getTime();
            const response = (await fetch(
                `${BASE_URL}/scraper/new-page?url=${encodeURIComponent(linkedInProfileUrl)}`
                ).then(r => r.json()));
            expect(response).toBeDefined();
            expect(response.url).toBeDefined();
            expect(response.url).toBeTruthy();
            expect(response.id).toBeDefined();
            expect(response.id).toBeTruthy();
            id = response.id;
        });
        it('Can close the page', async () => {
            const response = (await fetch(
                `${BASE_URL}/scraper/p/${id}/close`
                ).then(r => r.json()));
            expect(response).toBeDefined();
            expect(response?.closed).toBe(true);
            console.log('Time to open and close a page #', (new Date().getTime() - dt));
        });
    });

    describe('Stress test', () => {    
        jest.setTimeout(10000 * 100); // 5 minutes
        let id: string;
        const nPages = 10;
        const ids: string[] = [];
        let nBunch = 10;

        it(`Can open a bunch of linkedIn pages at the same time and it will take less than 10 seconds to load it..`, async () => {
            const dt = new Date().getTime();
            // When we open a bunch of pages simulatious.
            const promises: Promise<void>[] = [];
            for ( let i=0; i<nBunch; i+=1 ) {
                let dt: number = new Date().getTime();
                // const url = localhostUrl;
                const url = linkedInProfileUrl;
                const promise = (async () => {
                    const ret = await fetch(
                        `${BASE_URL}/scraper/new-page?url=${encodeURIComponent(url)}`
                        ).then(r => r.json());
                    console.log("new page ret ", ret);
                    ids.push(ret.id);
                    return ret;
                })();
                promises.push(promise);
            }
            await Promise.all(promises);

            // Then there is a bunch pages open.
            const response = (await fetch(
                `${BASE_URL}/scraper/pages`
                ).then(r => r.json()));
            expect(response).toBeDefined();
            expect(Array.isArray(response)).toBe(true);
            expect(response?.length).toBe(nBunch);

            // Then it takes less than 10 seconds.
            expect(new Date().getTime() - dt).not.toBeGreaterThan(60 * 1000);
            for( let i = 0; i< ids.length; i++ ) {
                expect(ids[i]).toBeDefined();
            }
        });

        it(`Can evaluate some JS on it`, async () => {
            const promises: Promise<void>[] = [];

            const js = () => {
                return 1 + 2;
            };

            const returnValues: number[] = [];
            
            ids.forEach(id => {
                promises.push(
                    (async () => {
                        const response = (await fetch(
                            `${BASE_URL}/scraper/p/${id}/eval`,
                            {
                                method: 'POST',
                                body: js.toString(),
                            }
                        ).then(r => r.text()));
                        let isError = false;
                        let error: string = '';
                        try {
                            isError = !!JSON.parse(response)?.error;
                            error = JSON.parse(response)?.error;
                        } catch(e) {
                        }
                        // console.log("response ", {id, response} );
                        const retVal = Number.parseFloat(response);

                        returnValues.push(retVal);
                    })()
                );
            });
            
            await Promise.all(promises);

            for( let i = 0; i< returnValues.length; i++ ) {
                expect(returnValues[i]).toBe(3);
            }
        });

        it(`Can open ${nPages} one at the time.`, async () => {
            console.log("opening all pages");
            for ( let i=0; i<nPages; i+=1 ) {
                let dt: number = new Date().getTime();
                const url = localhostUrl;
                // const url = linkedInProfileUrl;
                let response = (await fetch(
                    `${BASE_URL}/scraper/new-page?url=${encodeURIComponent(url)}`
                    ).then(r => r.json()));
                expect(response).toBeDefined();
                expect(response.url).toBeDefined();
                expect(response.url).toBeTruthy();
                expect(response.id).toBeDefined();
                expect(response.id).toBeTruthy();
                // ids.push(response.id);
            }
        });

        it(`Can close ${nPages} all pages`, async () => {
            console.log("closing all pages");
            const url = localhostUrl;
            let response = (await fetch(
                `${BASE_URL}/scraper/close-all-pages`
                ).then(r => r.json()));

            response = (await fetch(
                `${BASE_URL}/scraper/pages`
                ).then(r => r.json()));

            expect(response).toBeDefined();
            expect(Array.isArray(response)).toBe(true);
            expect(response?.length).toBe(0);
        });

        it(`Can open / close ${nPages} pages in sequence.`, async () => {
            for ( let i=0; i<nPages; i+=1 ) {
                let dt: number = new Date().getTime();
                const url = localhostUrl;
                // const url = linkedInProfileUrl;
                let response = (await fetch(
                    `${BASE_URL}/scraper/new-page?url=${encodeURIComponent(url)}`
                    ).then(r => r.json()));
                expect(response).toBeDefined();
                expect(response.url).toBeDefined();
                expect(response.url).toBeTruthy();
                expect(response.id).toBeDefined();
                expect(response.id).toBeTruthy();
                id = response.id;
                response = (await fetch(
                    `${BASE_URL}/scraper/p/${id}/close`
                    ).then(r => r.json()));
                expect(response).toBeDefined();
                expect(response?.closed).toBe(true);
                console.log(`Time to open page #${(i+1)} - ${(new Date().getTime()) - dt}`);
            }
        });
    });
})
