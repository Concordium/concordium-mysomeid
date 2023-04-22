export function littleEndianHexNumStringToNumber(hexString: string) {
    // Reverse the little-endian hex string to make it big-endian
    let bigEndianHexString = "";
    for (let i = hexString.length - 2; i >= 0; i -= 2) {
        bigEndianHexString += hexString.slice(i, i + 2);
    }

    // Convert the big-endian hex string to a number
    let number = parseInt(bigEndianHexString, 16);

    return number;
}
