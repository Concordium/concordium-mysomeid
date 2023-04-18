console.log("Background");

declare var chrome: any;

let TEST = false;

const SERVICE_BASE_URL = () => TEST ? 'http://localhost:4200' : `https://api.mysomeid.dev/v1`;
//const WEBSITE_BASE_URL = () => TEST ? `http://localhost:3000` : `https://mysomeid.dev`;

// Initialise.
let state: any = null;
chrome.storage.local.get("state", (result: any) => {
	console.log("Init storage ; ", result);
	if (!result.state) {
		console.log("Creating empty state");
	}
	state = result.state ?? {};
	if (state['staging'] === undefined) {
		state['staging'] = false;
	}
	TEST = state ? state['staging'] : null;
	console.log("Test ", TEST);
});

chrome.runtime.onInstalled.addListener(function () {
	console.log("ChromeExtension: Installed");
	chrome.tabs.query({}, (tabs: any) => {
		tabs.map((tab: any) => ({tabId: tab.id, tabUrl: tab.url}))
			.forEach(({tabId, tabUrl}: any) =>
			{
				// Reload tabs
				if (tabUrl.toLowerCase().indexOf('/create/1') >= 0 || tabUrl.indexOf('linkedin') >= 0 ) {
					chrome.tabs.reload(tabId);
				}
			}
		);
	});
});

chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: (what: any) => void) => {
	console.log("onMessage", {
		request,
		sender,
		sendResponse,
	});

	const {
		type,
		from,
		serial: s
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
		console.log('send ack');
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
	}
	else if (type === 'update-registration') {
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

			await (new Promise<any>(resolve => {
				if (!state) {
					console.error("Warning storage should already be initialised.")
					chrome.storage.local.get("state", (r: any) => {
						if (!r.state) {
							console.error("Creating empty state");
						}
						state = r.state ?? {};
						resolve(state);
					});
				} else {
					resolve(state);
				}
			}));

			await (new Promise<void>(resolve => {
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

				console.log("setting registration");
				chrome.storage.local.set({ state }, () => {
					resolve();
				});
			}));

			sendResponse({ state, to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome' });
			console.log("updating registrations ", state.regs);


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

		const data = { to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome', payload };
		console.log("Sending response ", data);
		sendResponse(data);
		return;

	} else if (type === 'refresh-platform-pages') {
		// TODO: Loop through all tabs and refresh them.
		const data = { to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome', payload: {} };
		console.log("Sending response ", data);
		sendResponse(data);
		return;

	} else if (type === "getState" || type === 'get-state') {
		console.log("RECV: get-state ", state);
		if (state === null) {
			chrome.storage.local.get("state", (r: any) => {
				state = r.state ?? {};
				sendResponse({ state, to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome' });
			});
		} else {
			sendResponse({ state, to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome' });
		}
		return true;

	} else if (type === "setState" || type === 'set-state') {
		const { key, value } = request.args;

		if (!state) {
			chrome.storage.local.get("state", (r: any) => {
				state = {
					...(r?.state ?? {}),
					[key]: value,
				};
				chrome.storage.local.set({ state }, () => {
					sendResponse({ state, to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome' });
				});
			});

		} else {
			state = {
				...state,
				[key]: value,
			};
			chrome.storage.local.set({ state }, () => {
				sendResponse({ state, to: from, from: 'background', type: resp(type), serial, responseTo: s, origin: 'mysome' });
			});
		}
		return true;

	} else {
		console.log("sendign default not recognised ack");
		sendResponse({});
	}
});
