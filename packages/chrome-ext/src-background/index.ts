declare var chrome: any;

import {
	sharedConfig,
	EnvironmentTypes
} from '@mysomeid/chrome-ext-shared';

// 

let environment: EnvironmentTypes | null = null;
let verbose = false;
let storageInitialised = false;
let storageFailedInitialising = false;

const SERVICE_BASE_URL = async (): Promise<string> => {
	if (storageFailedInitialising) {
		throw new Error('Cannot get base url as storage has failed initialising');
	}
	// Wait until storage has been initialised.
	while(!storageInitialised) {
		await new Promise<void>(resolve => setTimeout(resolve, 1000));
	}

	if ( !environment ) {
		throw new Error('Cannot get service base url since environment is not initialised');
	}

	const result = sharedConfig?.environments?.[environment]?.serviceBaseUrl;
	if (!result) {
		throw new Error('Failed retriving service base url for environment: ' + environment);
	}
	return result;
}

const stores: Record<string, any> = {};

const initStore = async (storeName: string): Promise<boolean> => {
	storeName = storeName ?? 'state';
	verbose && console.log("initStore ", { storeName });
	return new Promise<boolean>(resolve => {
		chrome.storage.local.get(storeName, (result: any) => {
			verbose && console.log(`Init ${storeName} store`, result?.[storeName]);
			let createdNew = false;
			if (!result?.[storeName]) {
				verbose && console.log("Creating empty store");
				createdNew = true;
			}
			stores[storeName] = result?.[storeName] ?? {};
			resolve(createdNew);
		});
	});
};

const fetchStore = async (storeName: string, allowCached = false) => {
	if (storageFailedInitialising) {
		throw new Error('Cannot get store as storage has failed initialiasing');
	}
	while(!environment) {
		console.warn("Waiting for environment to be initialised");
		await new Promise<void>(resolve => setTimeout(resolve, 1000));
	}
	storeName = storeName ?? 'state';
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
	return new Promise<void>(resolve => {
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
	verbose && console.log("upsertStore ", { storeName, data });
	return new Promise<any>(resolve => {
		chrome.storage.local.get(storeName, (result: any) => {
			const before = result?.[storeName];
			const store = {
				...(before ?? {}),
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

chrome.runtime.onInstalled.addListener(function () {
	verbose && console.log("ChromeExtension: Installed");
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
			platform,
			userData,
		} = request?.payload ?? {};
		if (platform !== 'li' || !proofUrl || !firstName || !lastName || !userData) {
			sendErrorResponse('invalid args');
			return;
		}
		SERVICE_BASE_URL().then(base => {
			proofUrl = encodeURIComponent(proofUrl);
			firstName = encodeURIComponent(firstName);
			lastName = encodeURIComponent(lastName);
			userData = encodeURIComponent(userData);
			const url = `${base}/proof/validate-proof-url?url=${proofUrl}&firstName=${firstName}&lastName=${lastName}&platform=${platform}&userData=${userData}`;
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
			verbose && console.log("Updated registrations ", state.regs);
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

initStore('state').then(createdNewStore => {
	if ( !stores?.state  ) {
		throw new Error('Error stores not initialised');
	}

	// If environment is not initialised we will default to main-net.
	let setToDefault = false;
	if ( [null, undefined].indexOf(stores.state['environment']) >= 0 ) {
		stores.state['environment'] = sharedConfig.defaultEnvironment;
		setToDefault = true;
	}

	// If verbose is not initised we will default to not showing any verbose.
	if ( [null, undefined].indexOf(stores.state['verbose']) >= 0 ) {
		stores.state['verbose'] = sharedConfig.defaultVerbose;
		setToDefault = true;
	}

	verbose = !!stores.state['verbose'];
	environment = stores.state['environment'] as EnvironmentTypes;

	verbose && console.log("Config: ", {
		verbose,
		environment,
	});

	if ( createdNewStore || setToDefault ) {
		saveStore('state', stores.state).then(() => {
			storageInitialised = true;	
		}).catch(err => {
			storageFailedInitialising = true;
		});	
	} else {
		storageInitialised = true;
		storageFailedInitialising = false;
	
	}
}).catch( err => {
	storageFailedInitialising = true;
})

initStore('platform-requests');
