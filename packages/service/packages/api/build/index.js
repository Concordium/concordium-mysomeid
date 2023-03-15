import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import express from 'express';
// import axios, {isCancel, AxiosError} from 'axios';
// import request from 'request';
import bodyParser from 'body-parser';
// import Jimp from 'jimp';
import { BrowserHttpService, BrowserInterface } from './scraper';
import { fetchQRFromImageUrls, } from './fetch-image-from-url';
import { createProof, verifyProof, } from './utils/proofs';
import cors from 'cors';
import qr from 'qr-image';
import createContractInterface from './mysomeid-contract';
import { AttributesKeys, getIdProof, HttpProvider, IdStatementBuilder, JsonRpcClient, verifyIdstatement } from '@concordium/node-sdk';
let browser;
const CONTRACT_NAME = process.env.CONTRACT_NAME ?? "mysomeid";
const CONTRACT_INDEX = BigInt(Number.parseInt(process.env.CONTRACT_INDEX ?? '2312'));
const CONTRACT_SUB_INDEX = BigInt(0);
const contract = createContractInterface({ CONTRACT_NAME, CONTRACT_INDEX, CONTRACT_SUB_INDEX });
const client = new JsonRpcClient(new HttpProvider("https://json-rpc.testnet.concordium.com"));
const state = (() => {
    let challenges = [];
    let tokens = [];
    let globalContext;
    const stmtBldr = new IdStatementBuilder();
    stmtBldr.revealAttribute(AttributesKeys.firstName);
    stmtBldr.revealAttribute(AttributesKeys.lastName);
    // stmtBldr.revealAttribute(AttributesKeys.sex);
    stmtBldr.revealAttribute(AttributesKeys.nationality);
    // stmtBldr.revealAttribute(AttributesKeys.idDocIssuer);
    // stmtBldr.revealAttribute(AttributesKeys.idDocIssuedAt);
    const statement = stmtBldr.getStatement();
    try {
        verifyIdstatement(statement);
    }
    catch (e) {
        console.error("Error creating statement", e);
        process.exit(-1);
    }
    const init = async () => {
        // const consensusStatus = await client.getConsensusStatus();
        // console.log("consensusStatus ", consensusStatus);
        const response = await client.getCryptographicParameters();
        if (!response?.value) {
            throw new Error('failed to fetch cruptographic params');
        }
        globalContext = response?.value;
        console.log("cryptoParams ", globalContext);
    };
    const addChallenge = (c) => {
        challenges.push(c);
    };
    const challengeStatus = (challenge) => {
        const ret = challenges.find(x => x.challenge === challenge);
        if (!ret) {
            throw new Error('No result');
        }
        return ret;
    };
    return () => ({
        init,
        challenges,
        tokens,
        globalContext,
        statement,
        addChallenge,
        challengeStatus,
    });
})();
const app = express();
const port = process.env.PORT ?? 4200;
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.json({});
});
// Test
// OK: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/D4E16AQFVBt9a2DGNVw/profile-displaybackgroundimage-shrink_350_1400/0/1670391545559?e=1675900800&v=beta&t=wCxvt-suzHjWdycQPFzHsGK75cLzgbBViqiQUdEcRTQ"]}' 127.0.0.1:4200/validate-image-url
// Fail: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/C5603AQEUWqNnctVw9A/profile-displayphoto-shrink_800_800/0/1661394116755?e=1675900800&v=beta&t=SnSlXB1L57hj3IHKOJ0TK2PRuf1qM2zVqjfq8hJ5UtI"]}' 127.0.0.1:4200/validate-image-url
// Ok 2: curl -X POST -H "Content-Type: application/json" -d '{"urls": ["https://media-exp1.licdn.com/dms/image/C5603AQEUWqNnctVw9A/profile-displayphoto-shrink_800_800/0/1661394116755?e=1675900800&v=beta&t=SnSlXB1L57hj3IHKOJ0TK2PRuf1qM2zVqjfq8hJ5UtI", "https://media-exp1.licdn.com/dms/image/D4E16AQFVBt9a2DGNVw/profile-displaybackgroundimage-shrink_350_1400/0/1670391545559?e=1675900800&v=beta&t=wCxvt-suzHjWdycQPFzHsGK75cLzgbBViqiQUdEcRTQ"]}' 127.0.0.1:4200/validate-image-url
app.post("/validate-image-url", async (req, res) => {
    const urls = req.body.urls;
    const firstPosRes = await fetchQRFromImageUrls(urls);
    if (firstPosRes) {
        return res.json({
            url: firstPosRes.url,
            result: firstPosRes.result,
        });
    }
    return res.json({
        result: null,
    });
});
app.get('/statement', (req, res) => {
    res.json({ statement: state().statement });
    // res.json([{"type":"AttributeInSet","attributeTag":"countryOfResidence","set":["AT","BE","BG","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","HR"]},{"type":"AttributeInRange","attributeTag":"dob","lower":"18000101","upper":"20091212"}]);
});
app.get('/challenge', (req, res) => {
    const { account } = req.query;
    const array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
    }
    const challenge = Buffer.from(array).toString('hex');
    state().addChallenge({ account, challenge, createdAt: new Date() });
    res.json({ challenge });
    // res.json([{"type":"AttributeInSet","attributeTag":"countryOfResidence","set":["AT","BE","BG","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","HR"]},{"type":"AttributeInRange","attributeTag":"dob","lower":"18000101","upper":"20091212"}]);
});
app.post('/prove', async (req, res) => {
    const { challenge, proof } = req.body;
    console.log("prove ", { challenge, proof });
    const status = state().challengeStatus(challenge);
    let credId = proof.credential;
    const accInfo = await client.getAccountInfo(status.account);
    const accCreds = accInfo?.accountCredentials;
    console.log('accCreds', JSON.stringify(accCreds, null, ' '));
    console.log("credId ", credId);
    console.log("account ", status.account);
    console.log("account info ", accInfo);
    const seedAsHex = "";
    const idObject = {
        preIdentityObject: null,
        attributeList: null,
        signature: "asdasd",
    };
    const params = {
        idObject,
        globalContext: state().globalContext,
        seedAsHex: "efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860",
        net: 'Testnet',
        identityProviderIndex: 0,
        identityIndex: 0,
        credNumber: 0,
        statement: state().statement,
        challenge,
    };
    debugger;
    getIdProof(params);
    // statement.
    res.json({ asd: "asd" });
    // res.json([{"type":"AttributeInSet","attributeTag":"countryOfResidence","set":["AT","BE","BG","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","HR"]},{"type":"AttributeInRange","attributeTag":"dob","lower":"18000101","upper":"20091212"}]);
});
/*app.get('/image', (req, res) => {
  // Create a new image with Jimp
  Jimp.create(200, 200, 0xFFFFFFFF)
    .then(image => {
      // Draw a black circle on the image
      image.circle({radius: 100, x: 100, y: 100});
      image.getBufferAsync(Jimp.MIME_PNG)
        .then((buffer: any) => {
          res.setHeader('Content-Type', Jimp.MIME_PNG);
          res.send(buffer);
        });
    });
});*/
// Return a proof validation 
// Fail:
// curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/validation?p=li&u=crispy-beans-12321312&proof=dd68464234ae19438f06b66c017e14b7f0305b94313d4dc0252413abeb232355"
// Ok:
// curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/validation?p=li&u=crispy-beans-12321312&proof=cc58464234ae19438f06b66c017e14b7f0305b94313d4dc0252413abeb2323ea"
app.get('/proof/validation', (req, res) => {
    const { proof, u, p } = req.query;
    if (!u || !p || !proof) {
        return res.status(500).send(`{"error": "invalid arguments (1)"}`);
    }
    const { ok, value } = verifyProof(u ?? '', p ?? '', proof ?? '');
    return res.json({
        user: u,
        platform: p,
        valid: ok,
        // verbose: value,
    });
});
// curl -X GET -H "Content-Type: application/json" "http://127.0.0.1:4200/proof?p=li&u=crispy-beans-12321312"
app.get("/proof", (req, res) => {
    const { u, p } = req.query;
    if (!u || !p) {
        return res.status(500).send(`{"error": "invalid arguments (1)"}`);
    }
    if (["li"].indexOf(p) === -1) {
        return res.status(500).send(`{"error": "invalid arguments (2)"}`);
    }
    if (p === "li") {
        if (`${u}`.split("-").length < 2) {
            // The username must be int he format nameofuser-useridnumber
            return res.status(500).send(`{"error": "invalid arguments (3)"}`);
        }
    }
    const proof = createProof(u, p);
    return res.json({
        proof
    });
});
app.get('/imagetest', (req, res) => {
    // Read the image file from disk
    const data = fs.readFileSync(path.join(process.cwd(), 'nft.png'));
    if (!data) {
        res.status(500).send('Error reading image');
        return;
    }
    // Set the response content type to PNG and send the image data
    res.setHeader('Content-Type', 'image/png');
    res.send(data);
});
// Hacky temp. solution to get the nft image.
// curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/img?t=thumb"
// curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/img"
app.get('/proof/:proof/img', async (req, res) => {
    const { proof } = req.params;
    const { t: type, p: platform, r, } = req.query;
    const revoked = r == '1';
    console.log("revoked ", r, req.query);
    // Read the image file from disk
    const data = fs.readFileSync(path.join(process.cwd(), `nft${revoked ? '-revoked' : ''}.png`));
    if (!data) {
        res.status(500).send('Error reading image');
        return;
    }
    // Set the response content type to PNG and send the image data
    res.setHeader('Content-Type', 'image/png');
    res.send(data);
});
app.get('/proof/:proof/qr', async (req, res) => {
    const { proof } = req.params;
    const base = `https://app.mysomeid.dev`;
    const proofValidationUrl = `${base}/view/${proof}`;
    const result = qr.image(proofValidationUrl, { type: 'png' });
    result.pipe(res);
});
// curl -X GET -H "Content-Type: application/json" "127.0.0.1:4200/proof/meta"
app.get("/proof/meta/:proof", (req, res) => {
    const { p } = req.query;
    const { proof } = req.params;
    return res.json({
        name: "MySoMeID Proof",
        decimals: 0,
        description: "Soulbound NFT used to proof that a profile on a social media account is valid.",
        unique: true,
        thumbnail: { url: `https://api.mysomeid.dev/v1/proof/${proof}/img?t=thumb?p=${p}` },
        display: { url: `https://api.mysomeid.dev/v1/proof/${proof}/img?t=display?p=${p}` },
    });
});
app.get("/profile-info", async (req, res) => {
    const { p, id, } = req.query;
    console.log("platform ", p);
    console.log("id (name) ", id);
    if (!id) {
        console.log("Invalid parameter id(name) ", id);
        res.status(500);
        return;
    }
    if (['linked-in'].indexOf((p ?? '').toLowerCase()) === -1) {
        console.log("Invalid parameter platform, ", p);
        res.status(500);
        return;
    }
    const url = `https://www.linkedin.com/in/${id}/`;
    const context = await browser.showPage({ url, reuse: true, width: 600, height: 430 });
    const location = await context.eval(() => {
        return window.location.href;
    });
    let profileExists = null;
    // The user doesnt exist.
    if (location.indexOf('404') >= 0) {
        profileExists = false;
    }
    else if (location.indexOf('404') === -1) {
        const notFoundWhileNotLoggedIn = await context.eval(() => {
            return !!document.querySelector("h1.page-not-found__headline");
        });
        if (notFoundWhileNotLoggedIn) {
            profileExists = false;
        }
    }
    let profileInfo = null;
    if (profileExists !== false) {
        profileInfo = await context.eval(() => {
            const document = window.document;
            const profileImgEl = document.querySelector("img.pv-top-card-profile-picture__image,.profile-photo-edit__preview");
            const backgroundImgEl = document.querySelector("img.profile-background-image__image");
            return profileImgEl ? {
                name: profileImgEl?.alt ?? null,
                profileImage: profileImgEl?.src ?? null,
                backgroundImage: backgroundImgEl?.src ?? null,
            } : null;
        });
        if (!profileInfo) {
            profileExists = null; // LinkedIN HTML has maybe changed - null === fault tolerant value which is true-ish.
        }
        else {
            profileExists = true;
        }
    }
    console.log("ret ", profileExists);
    let data = null;
    try {
        data = profileExists === true ?
            await context.screenshot({ fullPage: false })
            :
                null;
    }
    catch (e) {
        console.error(e);
    }
    try {
        await context.close();
    }
    catch (e) {
        console.error(e);
    }
    // const tmp = data.toString('base64');
    res.json({
        profileExists,
        profileInfo,
        url,
        screenshot: data ? data.toString('base64') : null,
    });
});
(async () => {
    console.log('⚡️[server]: initializing state');
    await state().init();
    console.log('⚡️[server]: Creating browser interface');
    browser = new BrowserInterface({ lazy: true, width: 600, height: 430 });
    await browser.initialize({ headless: true });
    const http2 = new BrowserHttpService();
    await http2.start(browser);
    console.log('⚡️[server]: Starting Http REST API');
    app.listen(port, () => {
        console.log(`⚡️[server]: API is served at http://localhost:${port}`);
    });
})().catch(e => {
    console.error(e);
    process.exit(-1);
});
