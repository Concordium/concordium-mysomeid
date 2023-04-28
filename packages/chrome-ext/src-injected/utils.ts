// declare var chrome: any;

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

export const getPlatform = (): null | 'li' => {
	if (window.location.host.indexOf("linkedin.com") >= 0 ) {
		return 'li';
	}
	return null;
};

export const getProfileNameInUrl = (): string => {
	if ( !isOnLinkedInProfileUrl() ) {
		return '';
	}
	return window.location.pathname.split("/")[2];
};

export const getUrlToCreateProof = (platform: 'li' | 'test' | null = 'li') => {
	if ( platform === 'li' || platform === 'test' ) {
		const u = getProfileNameInUrl();
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

		return `https://app.testnet.mysome.id/create/1?template=${data}`;
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

	if ( host.indexOf("localhost:3000") >= 0 ) {
		return 'mysomeid';
	}

	return null;
}

export const onOwnLinkedInProfileOrFeedUrl = () => {
	const onFeed = window.location.host.indexOf("linkedin.com") >= 0 && window.location.pathname === "/feed/";
	const onProfilePage = isOnLinkedInProfileUrl();
	const foundEditIntroElement = !!document.querySelector("button[aria-label=\"Edit intro\"]");
	const ok = onFeed || (onProfilePage && foundEditIntroElement);
	return ok;
};

/* export const storage = new (class {
	state: any = null;

	async init() {
		if ( this.state !== null ) {
			console.error("Alreadty initialised");
			return;
		}
		return new Promise<void>(resolve => {
			chrome.runtime.sendMessage({method: "get-state"}, ({state}: any) => {
				this.state = state;
				resolve();
			});
		});
	}

	async set(key: string, value: any) {
		return new Promise<void>(resolve => {
			chrome.runtime.sendMessage({method: "set-state", args: {key, value}}, () => {
				this.state = {
					...(this.state ?? {}),
					[key]: value,
				};
				resolve();
			});
		});
	}

	async get(key: string): Promise<any> {
		return new Promise<void>(resolve => {
			if ( this.state === null ) {
				this.init().then(() => {
					resolve(this.state[key]);
				});
			} else {
				resolve(this.state[key]);
			}
		});
	}

});
*/