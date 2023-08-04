import { logger } from '@mysomeid/chrome-ext-shared';
import { toByteArray } from 'base64-js';

/**
 * Returns true if the url contains a percentage encoded base64 encoded encryption key in the pathname.
 * 
 * If the encryption key component of the pathname is not percentage encoded the method returns false
 * If the percentage decoded encryption key component is not a valid base64 encoded string the method returns false
 * 
 * Example url: 
 * https://app.mysome.id/v/61/HmFk4N0K7PnOIji3u2nDNMbzt0LdwxDxoIF9lh8j1Uw%3D
 *
 * See: https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding
 */
export const isProofUrlDecryptionKeyValid = (urlString: string): boolean => {
	try {
		const url = new URL(urlString); // throws if url is invalid.
		const path = url.pathname.split('/');
		if (path.length !== 4) {
			logger.error('Url pathname must follow the format /<page>/<id>/<decryptionKey>', urlString);
			return false;
		}

		const decryptionKey = path?.[3] ?? null;
		if (!decryptionKey) {
			logger.error('Url contained no decryption key', urlString);
			return false;
		}

		// Since base64 can contain / and = characters the decryptionKey
		// is percentage encoded.
		const decodedKeyComponent = decodeURIComponent(decryptionKey);

		// Decode the string to see if it's not valid base64.
		const validBase64 = ((str: string): boolean => {
			try {
				// Attempt to decode the base64 string.
				// If the string is not valid base64, an error will be thrown.
				toByteArray(str);
				return true;
			} catch (error) {
				return false;
			}
		})(decodedKeyComponent);

		return validBase64;
	} catch (e) {
		logger.warn("Attempting to decode url failed", e);
		return false;
	}
};
