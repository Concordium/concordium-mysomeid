import { isProofUrlDecryptionKeyValid } from './proof-url-tools';

describe('isProofUrlDecryptionKeyValid', () => {
	it('can recognize valid percentage encoded base64 decryption key', () => {
		const validDecryptionKey = '/d3FqHZ7VLtmDRenZAtZGvQxt3MZJ4fUV2mkMDEF+3I=';
		const validUrl = `https://mysome.id/v/69/${encodeURIComponent(validDecryptionKey)}`;
		const result = isProofUrlDecryptionKeyValid(validUrl);
		expect(result).toBe(true);
	});

	it('can detect if the decryption key is not percentage encoded', () => {
		const validEncryptionKey = '/d3FqHZ7VLtmDRenZAtZGvQxt3MZJ4fUV2mkMDEF+3I=';
		const invalidUrl = `https://mysome.id/v/${validEncryptionKey}`;
		const result = isProofUrlDecryptionKeyValid(invalidUrl);
		expect(result).toBe(false);
	});

	it('can detect an invalid character in percentage encoded string', () => {
		const invalidDecryptionKey = 'U29tZSB2YWxpZCBiYXNlNjQgZGF0YQ==!';
		const validUrl = `https://mysome.id/v/69/${invalidDecryptionKey}`;
		const result = isProofUrlDecryptionKeyValid(validUrl)
		expect(result).toBe(false);
	});

	it('can detect invalid padding', () => {
		const invalidDeryptionKey = 'U29tZSB2YWxpZCBiYXNlNjQgZGF0YQ=';
		const validUrl = `https://mysome.id/v/69/${invalidDeryptionKey}`;
		const result = isProofUrlDecryptionKeyValid(validUrl);
		expect(result).toBe(false);
	});

	it('can detect an invalid formed url', () => {
		const decryptionKey = 'HmFk4N0K7PnOIji3u2nDNMbzt0LdwxDxoIF9lh8j1Uw=';
		const invalidUrl = `https://mysome.id/v/${decryptionKey}`;
		const result = isProofUrlDecryptionKeyValid(invalidUrl);
		expect(result).toBe(false);
	});

	it('can detect if the proof url itself is percentage encoded', () => {
		const validDecryptionKey = encodeURIComponent('/d3FqHZ7VLtmDRenZAtZGvQxt3MZJ4fUV2mkMDEF+3I=');
		const validUrl = `https://mysome.id/v/69/${validDecryptionKey}`;
		const invalidUrl = encodeURIComponent(validUrl);
		const result = isProofUrlDecryptionKeyValid(invalidUrl);
		expect(result).toBe(false);
	});
});

