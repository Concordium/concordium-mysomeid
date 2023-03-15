import {
	getMessageHandler
} from './content-messaging';

export async function traverseDomWithTimeout(path: string, timeout: number, interval = 100, throwIfNotFound = true): Promise<any> {
	let e: any = null;
	const ts = new Date().getTime();
	while(!e) {
		e = (document.querySelector(path) as any);
		if ( e ) {
			break;
		}
		if ( new Date().getTime() - ts > timeout ) {
			break;
		}
		await (new Promise<void>(resolve => setTimeout(resolve, interval)));
	}
	if ( !e && throwIfNotFound ) {
		throw new Error("Failed to find element : " + path);
	}
	return e;
}

export async function traverseDomAllWithTimeout(path: string, timeout: number, interval = 100, throwIfNotFound = true): Promise<any> {
	let e: any = null;
	const ts = new Date().getTime();
	while(!e) {
		e = (document.querySelectorAll(path) as any);
		if ( e ) {
			break;
		}
		if ( new Date().getTime() - ts > timeout ) {
			break;
		}
		await (new Promise<void>(resolve => setTimeout(resolve, interval)));
	}
	if ( !e && throwIfNotFound ) {
		throw new Error("Failed to find element : " + path);
	}
	return e;
}

export const verbose = (s: string, ...rest: any[] ) => {
	console.log('MySoMe: VERBOSE:', ...[s, ...rest]);
};

export const logger = {
	info: (s: string, ...rest: any[] ) => {
		console.log('MySoMe:', ...[s, ...rest]);
	},
	log: (s: string, ...rest: any[] ) => {
		console.log("MySoMe:", ...[s, ...rest]);
	},
	// info: (s: string, ...rest: any[] ) => {},
	error: (s: string, ...rest: any[] ) => {
		console.error('MySoMe:', ...[s, ...rest]);
	},
	// error: (s: string, ...rest: any[] ) => {},
	verbose: (s: string, ...rest: any[] ) => {
		console.log('MySoMe:', ...[s, ...rest]);
	},
	todo: (s: string, ...rest: any[] ) => {
		console.log('TODO:', ...[s, ...rest]);
	},
	// verbose: (s: string, ...rest: any[] ) => {},
};

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
	if (window.location.host.indexOf("linkedin.com") >= 0 ) {
		return 'li';
	}
	return null;
};

// TODO: this is linkedin only!!!
// TODO: move this to a utils folder in the linkedin integration!
export const getUserIdInUrl = (): string | null => {
	if ( !isOnLinkedInProfileUrl() ) {
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
	if ( !loc)  {
		// console.error("Not on feed url");
		return null;
	}
	const a = document.querySelector(".feed-identity-module")?.querySelector("a");
	const url = a?.href;
	// console.error("url tpo get profile name on feed page ", url);
	return url?.split("/")[4] ?? null;
}

// TODO: Move to linked in file.
export const getUserNameOnFeed = (): string | null => {
	const loc = window.location.pathname === "/feed/";
	if ( !loc)  {
		// console.error("Not on feed url");
		return null;
	}
	
	const name = Array.prototype.slice.call(
		document.querySelector(".feed-identity-module__actor-meta")?.querySelectorAll('div') ?? []
	).map( x =>x?.innerText?.trim()).filter(x => !!x?.trim() && x?.trim() !== '')?.[0] ?? null;

	if ( name?.length > 0 ) {
		return name;
	}

	return null;
}

// TODO: Move to linkedin.
export const getUserNameOnProfile = () => {
	const nameElement = (document.querySelectorAll("h1")[0]) as any as HTMLElement;
	if (!nameElement?.parentElement) {
		return null;
	}
	const name = nameElement?.innerText?.trim();
	return name ?? null;
}

export const getUrlToCreateProof = (platform: 'li' | 'test' | null = 'li') => {
	if ( platform === 'li' || platform === 'test' ) {
		const u = getUserIdInUrl();
		if ( !u ) {
			logger.error("Failed to get username from url");
			return;
		}
		
		const p = detectPlatform();
		if ( !p ) {
			logger.error("Failed to detect platform.");
			return;
		}

		verbose("username to create proof with ", u);
		const data = encodeURIComponent(utf8_to_b64(JSON.stringify({
			u,
			p,
		})));

		if ( platform === 'test' ) {
			return `http://localhost:3000/create/1?template=${data}`;
		}

		return `https://app.mysomeid.dev/create/1?template=${data}`;
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

	if ( host.indexOf("linkedin") >= 0 ) {
		return 'li';
	}

	if ( host.indexOf("localhost:8082") >= 0 ) {
		return 'test';
	}

	if ( host.indexOf("localhost:3000") >= 0 || host.indexOf("app.mysomeid.dev") >= 0 || host.indexOf("app.mysome.id") >= 0 ) {
		return 'mysomeid';
	}

	return null;
}

export const objToUrlParms = (obj: any) => Object.keys(obj).map( key => [key, obj[key]].join('=')).join('&');

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
		console.log("Storage: Init");
		if ( this.state !== null ) {
			console.error("Already initialised");
			return;
		}
		const {
			state
		} = await messageHandler.sendMessageWResponse("background", "get-state", {}, {type: 'get-state'} );
		console.log("Initial storage ", state);
		this.state = state ?? {};
	}

	async set(key: string, value: any) {
		console.log("Storage: set ", {key, value});
		if ( this.state === null ) {
			await this.init();
		}
		await messageHandler.sendMessageWResponse("background", "set-state", {}, {type: 'set-state', args: {key, value}} );
		this.state = {
			...(this.state ?? {}),
			[key]: value,
		};
	}

	async get(key: string, sync = false): Promise<any> {
		if ( this.state === null || sync ) {
			if  (sync) {
				console.log("Storage: Refreshing storage state");
				this.state = null;
			}
			await this.init();
		}
		if ( !this.state ) {
			throw new Error("Error no storage state object available");
		}
		return this.state[key];
	}
})();
