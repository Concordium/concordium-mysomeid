import {logger} from '@mysomeid/chrome-ext-shared';

import {
	getMessageHandler
} from './content-messaging';

import { WEBSITE_BASE_URL } from './integrations/linked-in';

import {
	mysome,
} from './root';

export async function traverseDomWithTimeout(path: string, timeout: number, interval = 100, throwIfNotFound = true): Promise<any> {
	let e: any = null;
	const ts = new Date().getTime();
	while (!e) {
		e = (document.querySelector(path) as any);
		if (e) {
			break;
		}
		if (new Date().getTime() - ts > timeout) {
			break;
		}
		await (new Promise<void>(resolve => setTimeout(resolve, interval)));
	}
	if (!e && throwIfNotFound) {
		throw new Error("Failed to find element : " + path);
	}
	return e;
}

export async function traverseDomAllWithTimeout(path: string, timeout: number, interval = 100, throwIfNotFound = true): Promise<any> {
	let e: any = null;
	const ts = (new Date()).getTime();
	while (!e) {
		e = (document.querySelectorAll(path) as any);
		if (e) {
			break;
		}
		if ((new Date()).getTime() - ts > timeout) {
			break;
		}
		await (new Promise<void>(resolve => setTimeout(resolve, interval)));
	}
	if (!e && throwIfNotFound) {
		throw new Error("Failed to find element : " + path);
	}
	return e;
}

export function utf8_to_b64(str: string) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

export function b64_to_utf8(str: string) {
	return decodeURIComponent(escape(window.atob(str)));
}

export const isOnLinkedInProfileUrl = () => {
	const ok = window.location.host.indexOf("linkedin.com") >= 0 && window.location.href.indexOf("/in/") >= 0;
	return ok;
};

export const isOnLinkedInFeedUrl = () => {
	const ok = window.location.host.indexOf("linkedin.com") >= 0 && window.location.href.indexOf("/feed/") >= 0;
	return ok;
}

export const getPlatform = (): null | 'li' => {
	if (window.location.host.indexOf("linkedin.com") >= 0) {
		return 'li';
	}
	return null;
};

// TODO: this is linkedin only!!!
// TODO: move this to a utils folder in the linkedin integration!
export const getUserIdInUrl = (): string | null => {
	if (!isOnLinkedInProfileUrl()) {
		return null;
	}
	return window.location.pathname.split("/")[2];
};

/*export const base64ToBlob2 = (b64Data: string, contentType='', sliceSize=512) => {
	const byteCharacters = atob(b64Data);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	const blob = new Blob([byteArray], {type: contentType});
	return blob;
};*/

export function base64ToBlob(base64Image: string) {
	// Split into two parts
	const parts = base64Image.split(';base64,');

	// Hold the content type
	const imageType = parts[0].split(':')[1];

	// Decode Base64 string
	const decodedData = window.atob(parts[1]);

	// Create UNIT8ARRAY of size same as row data length
	const uInt8Array = new Uint8Array(decodedData.length);

	// Insert all character code into uInt8Array
	for (let i = 0; i < decodedData.length; ++i) {
		uInt8Array[i] = decodedData.charCodeAt(i);
	}

	// Return BLOB image after conversion
	return {
		blob: new Blob([uInt8Array], { type: imageType }),
		imageType
	};
}

// TODO: move this to a utils folder in the linkedin integration!
export const getUserIdOnPageFeed = (): string | null => {
	const loc = window.location.pathname === "/feed/";
	if (!loc) {
		return null;
	}
	const a = document.querySelector(".feed-identity-module")?.querySelector("a");
	const url = a?.href;
	return url?.split("/")[4] ?? null;
}

export const $$ = (s: string): HTMLElement[] => {
	return Array.prototype.slice.call(document.querySelectorAll(s));
};

export const $ = (s: string): HTMLElement | null => {
	return document.querySelector(s);
};

export const $array = (nodeList: NodeListOf<HTMLElement> | undefined) => {
	return nodeList ? Array.prototype.slice.call(nodeList) : [];
};

// TODO: Move to linked in file. ( this is a linkedin only tool )
export const getUsersNameOnFeed = (): string | null => {
	const loc = window.location.pathname === "/feed/";
	if (!loc) {
		return null;
	}

	let name: string | null = $array($(".feed-identity-module__actor-meta")?.querySelectorAll('div'))
		.map(x => x?.innerText?.trim()).filter(x => !!x?.trim() && x?.trim() !== '')?.[0] ?? null;

	// If the 'Add a photo' button is visible it means that the user hasn't got a photo OR if the name looks like "Welcome, <first name>!" 
	// and the user will be shown as "Welcome, <first name>!" then we discard of the name.
	// The reason why both checks are needed is that LinkedIn loads elements async on the page so in 
	// case the addAPhotoButton is not yet loaded we will still check if the name matches the aforementioned pattern.
	const addAPhotoButton = !!$$('a > div > span').filter(x => x.innerText === 'Add a photo')[0];
	const nameLooksLikeWelcome = name && name.endsWith('!') && name.indexOf(', ') > 0;
	if ( (nameLooksLikeWelcome || addAPhotoButton) ) {
		name = null;
	}

	// Test if the AvatarGhost button is available and use this value since this is more reliable.
	// Note that the AvatarGhost button is not always availale on the feed so we cannot solely rely on that
	// to resolve the name.
	const avatarGhostButton = $$('button > img.ghost-person')[0] as HTMLImageElement;
	if ( avatarGhostButton && avatarGhostButton.alt ) {
		name = avatarGhostButton.alt;
	}

	// If we have found the name we will return it.
	if ( name && name.length > 0 ) {
		return name;
	}

	// Fallback: We can fall back on the code element if the other methods fails.
	// Needs more testing to see how robust it is; but this may be the best solution of them all
	// however its unclear when the element gets created as the intention is for analytics and not 
	// part of the actual website.
	const codeObject = $$('code').filter(x => x.innerText.indexOf('com.linkedin.voyager.common.Me') >= 0)
		.map(x => {
			try {
				return JSON.parse(x.innerText);
			} catch (e) {
				return null;
			}
		})[0];
	name = [
		codeObject?.included?.[0]?.firstName,
		codeObject?.included?.[0]?.lastName
	].filter( x => !!x ).join(' ');

	if (name?.length > 0) {
		return name;
	}

	return null;
}

// TODO: Move to linkedin.
export const getUsersNameOnProfile = () => {
	const nameElement = (document.querySelectorAll("h1")[0]) as any as HTMLElement;
	if (!nameElement?.parentElement) {
		return null;
	}
	const name = nameElement?.innerText?.trim() ?? null;
	return name ? name : null;
}

export const getUrlToCreateProof = (platform: 'li' | 'test' | null = 'li') => {
	if (platform === 'li' || platform === 'test') {
		const u = getUserIdInUrl();
		if (!u) {
			logger.error("Failed to get username from url");
			return;
		}

		const p = detectPlatform();
		if (!p) {
			logger.error("Failed to detect platform.");
			return;
		}

		logger.verbose("username to create proof with ", u);
		const data = encodeURIComponent(utf8_to_b64(JSON.stringify({
			u,
			p,
		})));

		if (platform === 'test') {
			return `http://localhost:3000/create/2?template=${data}`;
		}

		const webAppBaseUrl = WEBSITE_BASE_URL();
		return `${webAppBaseUrl}/create/2?template=${data}`;
	}

	throw new Error('Invalid platform : ' + platform);
}

export const blobToBase64 = (blob: any) => {
	const reader = new FileReader();
	reader.readAsDataURL(blob);
	return new Promise(resolve => {
		reader.onloadend = () => {
			resolve(reader.result);
		};
	});
};

export const detectPlatform = (): 'li' | 'test' | 'mysomeid' | null => {
	const host = window.location.host.toLowerCase();

	if (host.indexOf("linkedin") >= 0) {
		return 'li';
	}

	if (host.indexOf("localhost:8082") >= 0) {
		return 'test';
	}

	if (host.indexOf("localhost:3000") >= 0 || host.indexOf("app.mysomeid.dev") >= 0 || host.indexOf("app.mysome.id") >= 0 || host.indexOf("app.testnet.mysome.id") >= 0) {
		return 'mysomeid';
	}

	return null;
}

export const objToUrlParms = (obj: any) => Object.keys(obj).map(key => [key, obj[key]].join('=')).join('&');

export const onOwnLinkedInProfileOrFeedUrl = () => {
	const onFeed = isOnLinkedInFeedUrl();
	const onProfilePage = isOnLinkedInProfileUrl();
	const foundEditIntroElement = !!document.querySelector("button[aria-label=\"Edit intro\"]");
	// document.querySelector('.profile-topcard-background-image-edit__icon')
	const ok = onFeed || (onProfilePage && foundEditIntroElement);
	return ok;
};

const messageHandler = getMessageHandler();

export const storage = new (class {
	state: any = null;

	async init() {
		logger.log("Storage: Init");
		if (this.state !== null) {
			logger.error("Already initialised");
			return;
		}
		const {
			state
		} = await messageHandler.sendMessageWResponse("background", "get-state", { type: 'get-state', store: 'state' });
		logger.log("Initial storage ", state);
		this.state = state ?? {};
	}

	async set(key: string, value: any) {
		logger.verbose("Storage: set ", { key, value });
		if (this.state === null) {
			await this.init();
		}
		await messageHandler.sendMessageWResponse("background", "set-state", { type: 'set-state', store: 'state', key, value });
		this.state = {
			...(this.state ?? {}),
			[key]: value,
		};
	}

	async get(key: string, sync = false): Promise<any> {
		if (this.state === null || sync) {
			if (sync) {
				logger.log("Storage: Refreshing storage state");
				this.state = null;
			}
			await this.init();
		}
		if (!this.state) {
			throw new Error("Error no storage state object available");
		}
		return this.state[key];
	}
})();

export const registrations = new class {
	async fetch() {
		const regs = (await storage.get("regs", true)) ?? {};
		(mysome as any).regs = regs;
		logger.log("Regs", regs);
		return regs;
	}

	select(platform: string, userId: string) {
		const reg = mysome.regs?.[platform]?.[userId] ?? null;
		return reg;
	}

	async setRegStep(platform: string, userId: string, step: number) {
		const regs = (await storage.get("regs", true)) ?? {};
		regs[platform] = {
			[userId]: {
				...(regs[platform]?.[userId] ?? {}),
				step,
			}
		};
		mysome.regs = regs; // updated regs
		logger.log("storing new regs", regs);
		await storage.set('regs', regs);
	}
}();

export type PlatformRequest = {
	id: string;
	created: number;
	platform: string;
	requestType: string;
	status: 'created' | 'done',
};

export const platformRequests = new (class {
	platformRequests: PlatformRequest[] | null = null;

	async fetch(): Promise<PlatformRequest[]> {
		if (this.platformRequests !== null) {
			return this.platformRequests;
		}
		logger.log("Storage: Init");
		const {
			store
		} = await messageHandler.sendMessageWResponse("background", "get-state", { type: 'get-state', store: 'platform-requests' });
		logger.log("Platform requests (loaded when initialised) ", store);
		this.platformRequests = store?.array ?? [];
		if (this.platformRequests === null) {
			return [];
		}
		return this.platformRequests;
	}

	async removeRequest(id: string) {
		if (!this.platformRequests) {
			throw new Error('List where not initialised');
		}
		this.platformRequests = this.platformRequests.filter(x => x.id !== id);
		const key = 'array';
		const value = this.platformRequests;
		await messageHandler.sendMessageWResponse("background", "set-state", { type: 'set-state', store: 'platform-requests', key, value });
	}

	async removeRequests(platform: string) {
		if (!this.platformRequests) {
			throw new Error('List where not initialised');
		}
		this.platformRequests = this.platformRequests.filter(x => x.platform !== platform);
		const key = 'array';
		const value = this.platformRequests;
		await messageHandler.sendMessageWResponse("background", "set-state", { type: 'set-state', store: 'platform-requests', key, value });
		const {
			store
		} = await messageHandler.sendMessageWResponse("background", "get-state", { type: 'get-state', store: 'platform-requests' });
		logger.log("Platform requests (loaded when initialised) ", store);
		this.platformRequests = store?.array ?? [];
	}

	async set(value: PlatformRequest[]) {
		const key = 'array';
		logger.log("Platform requests: set ", { key, value });
		if (this.platformRequests === null) {
			await this.fetch();
		}
		await messageHandler.sendMessageWResponse("background", "set-state", { type: 'set-state', store: 'platform-requests', key, value });
	}

	async setState(value: PlatformRequest[]) {
		const key = 'array';
		logger.log("Platform requests: set ", { key, value });
		if (this.platformRequests === null) {
			await this.fetch();
		}
		await messageHandler.sendMessageWResponse("background", "set-state", { type: 'set-state', store: 'platform-requests', key, value });
	}

	async select(platform: string, status: string, requestType: string): Promise<PlatformRequest[] | null> {
		const array = await this.fetch();
		const requests = array.filter(x => x.platform === platform &&
			x.created > new Date().getTime() - 60000 * 30 &&
			x.status === status &&
			x.requestType === requestType
		);
		return requests ?? null;
	}
})();

