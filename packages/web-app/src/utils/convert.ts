export function littleEndianHexNumStringToNumber(hexString: string): number {
    // Reverse the little-endian hex string to make it big-endian
    let bigEndianHexString = "";
    for (let i = hexString.length - 2; i >= 0; i -= 2) {
        bigEndianHexString += hexString.slice(i, i + 2);
    }

    // Convert the big-endian hex string to a number
    let number = parseInt(bigEndianHexString, 16);

    return number;
}

export function numberToLittleEndianHexString(num: number): string {
    // Convert number to 64-bit binary string
    let binaryStr = (num >>> 0).toString(2).padStart(64, '0');

    // Split binary string into 8 chunks of 8 bits each
    let binaryChunks = binaryStr.match(/.{8}/g);

    // Reverse the order of the binary chunks to get little-endian format
    let littleEndianChunks = binaryChunks.reverse();

    // Convert each binary chunk to hex
    let hexChunks = littleEndianChunks.map(chunk => parseInt(chunk, 2).toString(16).padStart(2, '0'));

    // Concatenate the hex chunks into a single string
    let hexStr = hexChunks.join('');

    return hexStr;
}
