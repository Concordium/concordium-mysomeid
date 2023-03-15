import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { 
// ConcordiumNodeClient,
HttpProvider, JsonRpcClient, 
// TransactionStatusEnum
serializeUpdateContractParameters, deserializeReceiveReturnValue, } from "@concordium/node-sdk";
import { Buffer } from '@concordium/common-sdk/node_modules/buffer/index';
const consts = {
    testNet: {
        jsonRpcUrl: "https://json-rpc.testnet.concordium.com/",
        // genesisHash: "4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796",
        // explorerUrl: "https://wallet-proxy.testnet.concordium.com"
    },
    mainNet: {
        jsonRpcUrl: "https://json-rpc.concordium.com/",
        // genesisHash: "...",
        // explorerUrl: "https://wallet-proxy.concordium.com"
    },
};
const createStreamBuffer = (str, encoding) => {
    const buf = Buffer.from(str, encoding);
    let cursor = 0;
    return () => {
        readBigUInt64LE: () => {
            return null;
        };
    };
};
export default ({ CONTRACT_NAME, CONTRACT_INDEX, CONTRACT_SUB_INDEX: CONTRACT_SUB_INDEX = 0n }) => {
    const client = new JsonRpcClient(new HttpProvider(consts.testNet.jsonRpcUrl, fetch));
    const RAW_SCHEMA = fs.readFileSync(path.join(process.cwd(), 'mysomeid.schema.bin'), { encoding: 'base64' });
    const view = async () => {
        const result = await client.invokeContract({
            method: `${CONTRACT_NAME}.view`,
            contract: { index: CONTRACT_INDEX, subindex: CONTRACT_SUB_INDEX },
        });
        // console.log(result);
        if (result?.tag === 'success' && result.returnValue) {
            const returnValue = deserializeReceiveReturnValue(Buffer.from(result.returnValue, 'hex'), Buffer.from(RAW_SCHEMA, 'base64'), CONTRACT_NAME, 'view', 2);
            return returnValue;
        }
        else {
            console.error("Failed to read from contract ", result);
        }
        return null;
    };
    const tokenMetadataUrl = async (id) => {
        const parameter = serializeUpdateContractParameters(CONTRACT_NAME, 'tokenMetadata', [id], Buffer.from(RAW_SCHEMA, 'base64'));
        const params = {
            contract: {
                index: CONTRACT_INDEX,
                subindex: CONTRACT_SUB_INDEX
            },
            method: `${CONTRACT_NAME}.tokenMetadata`,
            parameter
        };
        return new Promise((resolve, reject) => {
            client
                .invokeContract(params)
                .then(result => {
                console.log("result ", result);
                if (result && result.tag === 'success' && result.returnValue) {
                    const bufferStream = Buffer.from(result.returnValue, 'hex');
                    const length = bufferStream.readUInt16LE(2);
                    const url = bufferStream.slice(4, 4 + length).toString('utf8');
                    resolve(url);
                }
                else {
                    console.log("failed to get metadata for token", id);
                    resolve(null);
                }
            });
        });
    };
    return {
        view,
        tokenMetadataUrl,
    };
};
