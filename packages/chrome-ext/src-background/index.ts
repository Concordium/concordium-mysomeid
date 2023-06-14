declare var chrome: any;

let TEST = false;
let verbose = false;

const SERVICE_BASE_URL = () => TEST ? 'http://0.0.0.0:8080/v1' : `https://api.mysomeid.dev/v1`;

const stores: Record<string, any> = {};

const initStore = async (storeName: string): Promise<void> => {
	storeName = storeName ?? 'state';
	console.log("initStore ", { storeName });
	return new Promise<void>(resolve => {
		chrome.storage.local.get(storeName, (result: any) => {
			console.log(`Init ${storeName} store`, result?.[storeName]);
			if (!result?.[storeName]) {
				console.log("Creating empty store");
			}
			stores[storeName] = result?.[storeName] ?? {};
			resolve();
		});
	});
};

const fetchStore = async (storeName: string, allowCached = false) => {
	storeName = storeName ?? 'state';
	console.log("fetchStore ", { storeName, allowCached });
	if (allowCached && stores[storeName] !== undefined) {
		return stores[storeName];
	}
	return new Promise<any>(resolve => {
		chrome.storage.local.get(storeName, (result: any) => {
			const store = {
				...(result?.[storeName] ?? {}),
			};
			stores[storeName] = store;
			chrome.storage.local.set({ [storeName]: store }, () => {
				stores[storeName] = store;
				resolve(store);
			});
		});
	});
};

const saveStore = async (storeName: string, value: any) => {
	storeName = storeName ?? 'state';
	console.log("saveStore ", { storeName, value });
	return new Promise<void>(resolve => {
		// console.log("setting registration");
		chrome.storage.local.set({ [storeName]: value }, () => {
			stores[storeName] = value;
			resolve();
		});
	});
};

const getCachedStore = (storeName: string) => {
	storeName = storeName ?? 'state';
	return stores[storeName];
};

const upsertStore = async (storeName: string, data: any) => {
	storeName = storeName ?? 'state';
	console.log("upsertStore ", { storeName, data });
	return new Promise<any>(resolve => {
		chrome.storage.local.get(storeName, (result: any) => {
			const store = {
				...(result?.[storeName] ?? {}),
				...(data ?? {}),
			};
			stores[storeName] = store;
			chrome.storage.local.set({ [storeName]: store }, () => {
				stores[storeName] = store;
				resolve(store);
			});
		});
	});
};

chrome.runtime.onInstalled.addListener(() => {
	console.log("ChromeExtension: Installed");
	chrome.tabs.query({}, (tabs: any) => {
		tabs.map((tab: any) => ({ tabId: tab.id, tabUrl: tab.url }))
			.forEach(({ tabId, tabUrl }: any) => {
				// Reload tabs
				if (tabUrl.toLowerCase().indexOf('/create/1') >= 0 || tabUrl.indexOf('linkedin') >= 0) {
					chrome.tabs.reload(tabId);
				}
			}
			);
	});
});

chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponseImpl: (what: any) => void) => {
	const sendResponse: (what: any) => void = (what: any) => {
		verbose && console.log("Sending message ", what);
		return sendResponseImpl(what);
	};

	verbose && console.log("onMessage", {
		request,
		sender,
		sendResponse,
	});

	const {
		type,
		from,
		serial: s,
		payload
	} = request;

	const resp = (s: string) => `${s}-response`;
	const serial = Math.round(Math.random() * 99999999999);

	const sendErrorResponse = (msg: string) => {
		sendResponse({
			to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome', payload: {
				error: msg,
			}
		});
	};

	const sendAck = () => {
		verbose && console.log('send ack');
		sendResponse({});
	};

	if (type === 'validate-proof') {
		let {
			proofUrl,
			firstName,
			lastName,
			userData,
		} = request?.payload ?? {};

		const {
			platform,
		} = request?.payload ?? {};

		if (platform !== 'li' || !proofUrl || !firstName || !lastName || !userData) {
			sendErrorResponse('invalid args');
			return;
		}
		const base = SERVICE_BASE_URL();
		proofUrl = encodeURIComponent(proofUrl);
		firstName = encodeURIComponent(firstName);
		lastName = encodeURIComponent(lastName);
		userData = encodeURIComponent(userData);
		const url =
			`${base}/proof/validate-proof-url?url=${proofUrl}&firstName=${firstName}&lastName=${lastName}&platform=${platform}&userData=${userData}`;
		fetch(url).then(res => {
			return res.json();
		}).then(obj => {
			if (obj === null) {
				setTimeout(() => {
					sendErrorResponse('no connection');
				});
			} else {
				setTimeout(() => {
					sendResponse({
						to: from,
						from: 'background',
						type: resp(type),
						serial,
						responseTo: s,
						origin: 'mysome',
						payload: {
							...obj,
						},
					});
				});
			}
		});
		return true;
	} else if (type === 'reload-tabs') {
		const {
			contains
		} = request?.payload ?? {};
		chrome.tabs.query({}, (tabs: any) => {
			tabs.map((tab: any) => ({ tabId: tab.id, tabUrl: tab.url }))
				.forEach(({ tabId, tabUrl }: any) => {
					if (tabUrl.toLowerCase().indexOf(contains?.toLowerCase())) {
						chrome.tabs.reload(tabId);
					}
				});
		});

	} else if (type === 'update-registration') {
		(async () => {
			const {
				state: registrationState,
			} = request?.payload ?? {};

			const {
				platform,
				username,
			} = registrationState;

			if (!platform || typeof platform !== 'string') {
				sendErrorResponse('No platform given');
				return;
			}

			if (!username || typeof username !== 'string') {
				sendErrorResponse('No username given');
				return;
			}

			if (!registrationState || typeof registrationState !== 'object') {
				sendErrorResponse('No state given');
				return;
			}

			const state = await fetchStore('state', true);

			// Make sure the state object contains at least an empty regs and object for the platform.
			state.regs = state.regs ?? {};
			state.regs[platform] = state.regs[platform] ?? {};

			const current = state?.regs[platform]?.[username] ?? {};

			const updated = {
				...(current ?? {}),
				...(registrationState ?? {}),
			};

			// update the state object with the update info.
			state.regs[platform][username] = updated;

			await saveStore('state', state);

			sendResponse({
				state, to: from,
				from: 'background',
				type: resp(type),
				serial,
				responseTo: s,
				origin: 'mysome'
			});
			console.log("Updated registrations ", state.regs);
		})().then().catch(console.error);
		return true;
	}

	else if (type === "get-url") {
		const file = request?.payload?.file ?? '';
		if (!file) {
			console.error("No file given");
			sendErrorResponse('No file given');
			return;
		}

		let url: string | undefined;
		try {
			url = chrome.runtime.getURL(file);
		} catch (e) {
			console.error(e);
		}

		const payload = {
			url,
		};

		sendResponse({
			to: from,
			from: 'background',
			type: resp(type),
			serial,
			responseTo: s,
			origin: 'mysome',
			payload
		});
		return;

	} else if (type === 'refresh-platform-pages') {
		// TODO: Loop through all tabs and refresh them.
		sendResponse({
			to: from,
			from: 'background',
			type: resp(type),
			serial,
			responseTo: s,
			origin: 'mysome',
			payload: {}
		});
		return;

	} else if (type === 'get-state') {
		const {
			store: storeName
		} = payload ?? {};
		fetchStore(storeName, true).then(store => {
			sendResponse({
				state: store,
				store,
				to: from,
				from: 'background',
				type: resp(type),
				serial,
				responseTo: s,
				origin: 'mysome'
			});
		});
		return true;

	} else if (type === 'set-state') {
		const {
			key,
			value,
			store: storeName
		} = payload ?? {};
		upsertStore(storeName, {
			[key]: value,
		}).then(store => {
			sendResponse({
				state: store,
				store,
				to: from,
				from: 'background',
				type: resp(type),
				serial,
				responseTo: s,
				origin: 'mysome'
			});
		});
		return true;

	} else {
		console.warn("Sending default not recognised ack : " + type);
		sendResponse({});
	}
});

initStore('state').then(() => {
	if (stores.state['staging'] === undefined) {
		stores.state['staging'] = false;
	}
	TEST = stores.state ? stores.state['staging'] : null;
	console.log("Config: Test ", TEST);
});

initStore('platform-requests');
