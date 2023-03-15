import crypto from 'crypto';
export function createProof(str, pw) {
    const proof = crypto.createHmac('sha256', pw)
        .update(str)
        .digest('hex');
    return proof;
}
export function verifyProof(str, pw, proof) {
    // Verify the proof by re-encrypting the string and pw and checking if the result matches the proof
    const encryptedString = crypto.createHmac('sha256', pw)
        .update(str)
        .digest('hex');
    return {
        ok: encryptedString === proof,
        value: encryptedString,
    };
}
