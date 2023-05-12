import {
	logger,
	verbose,
	storage,
	platformRequests,
	isOnLinkedInProfileUrl,
	isOnLinkedInFeedUrl,
	getUserIdInUrl,
	getUserIdOnPageFeed,
	onOwnLinkedInProfileOrFeedUrl,
	base64ToBlob,
	objToUrlParms,
	utf8_to_b64,
	getUsersNameOnProfile,
	getUsersNameOnFeed,
	registrations,
} from '../utils';
import {
	ShieldWidget,
	createShieldWidget,
} from '../shield';
import {
	// PopupWidget,
	showMessagePopup,
	showLoadingPopup,
	showFinalizePopup,
	countPopupsWithClassName,
} from '../popup';
import {
	mysome,
	RootWidget,
	createRootWidget,
} from '../root';
import { createTourWidget } from '../tour';
import {tracking, createTracker} from '../tracking';
import { getMessageHandler } from '../content-messaging';
import { request } from 'http';
let nvisit = 0;
let root: RootWidget = null as any as RootWidget;
let state = {
	proofUrl: '',
	pageHasBeenVerified: false,
};
let TEST = false;
export const WEBSITE_BASE_URL = () => TEST ? `http://localhost:3000` : `https://app.mysome.id`;
const SERVICE_BASE_URL = () => TEST ? 'https://api.testnet.mysome.id/v1' : `https://api.mysome.id/v1`;

let welcomeShown: boolean | null = null;
let shield: ShieldWidget | null = null;
type ProfileStatusCode = 'not-registered' | 'registered' | 'suspecious' | 'no-connection' | 'failed-resolve' | null;
type ProfileStatusPageTypes = 'feed' | 'profile' | 'other';
type ProfileStatusUserType = 'own' | 'other';
type ProfileStatus = {
	status: ProfileStatusCode;
	page: ProfileStatusPageTypes;
	type: ProfileStatusUserType;
};

const defaultMessages = {
	failedResolve: 'Unable to resolve the status of the profile',
	noConnection: 'No connection to the mysome.id service',
	notRegistered: 'This person\'s profile is not yet verified.<br/><br/>If you know them you can reach out to them and tell them how to secure their profile using mysome.id.',
	registered: 'This person\'s profile is verified by mysome.id',
	suspecious: 'This person\'s profile is not verified or suspicious',
	statusUnknown: 'This profile status is unknown',
};

const messages = {
	...defaultMessages,
};

const statusToStatusMessage = (status: ProfileStatusCode) =>
		status === 'no-connection' ?
			messages.noConnection :
		status === 'failed-resolve' ?
			messages.failedResolve :
		status === 'not-registered' ?
			messages.notRegistered :
		status === 'registered' ?
			messages.registered :
		status === 'suspecious' ?
			messages.suspecious :
		messages.statusUnknown;

const profileStatus = createTracker<ProfileStatus>({
	name: 'profileStatus',
	cmp: (curValue: ProfileStatus | null, compareWith: ProfileStatus | null) => {
		if ( !curValue || !compareWith ) {
			return curValue !== compareWith; // If both are null then false if one of them is a valid value then true.
		}
		if (curValue.status !== compareWith.status &&
				curValue.page !== compareWith.page &&
					curValue.type !== compareWith.type) {
			return true;
		}
		return false; // No change.
	}
});

function setPageStatus(page: ProfileStatusPageTypes, type: ProfileStatusUserType,) {
	const ps = profileStatus.get() ?? {
		status: null,
		page,
		type,
	};
	ps.page = page;
	ps.type = type;	
	profileStatus.update({
		query: () => ps,
	});
}

function setProfileStatusResolved(page: ProfileStatusPageTypes, type: ProfileStatusUserType, status: ProfileStatusCode ) {
	const ps = profileStatus.get() ?? {
		status,
		page,
		type,
	};
	ps.page = page;
	ps.type = type;	
	ps.status = status;	
	profileStatus.update({
		query: () => ps,
	});
}

declare global {
	interface ParentNode extends Node {
		qsa<E extends Element = Element>(selectors: string): HTMLElement[];
		qs(selectors: string): HTMLElement;
	}
}

function qsa(s: string): HTMLElement[] {
	return Array.prototype.slice.call(document.querySelectorAll(s) ?? []);
}

function qs(s: string): HTMLElement | null {
	return document.querySelector(s);
}

(HTMLElement.prototype as any).qsa = function(s: string): HTMLElement[] {
	return Array.prototype.slice.call(document.querySelectorAll(s) ?? []);
};

const _d: any = (HTMLElement.prototype as any).qs = function(s: string): HTMLElement | null {
	return document.querySelector(s);
};

const fetchQRFromImage = async (url: string): Promise<{
	qr: string | null,
	connectionError: boolean,
}> => {
	console.log("Getting QR code from url : " + url );
	if ( !url ) {
		throw new Error('No url provided');
	}

	try {
		const base = SERVICE_BASE_URL();
		const validateUrl = `${base}/qr/validate?url=${encodeURIComponent(url)}`;
		console.log("Getting QR code for : " + url );
		const qr = await fetch(validateUrl)
			.then(response => {
				if (response.status >= 200 && response.status < 300) {
					return response.text();
				};
				console.error("No QR code found " + response.status );
				const error = new Error(response.statusText);
				(error as any).response = response;
				throw error;
			})
			.then(response => JSON.parse(response))
			.then((data: any) => {
				return data?.error ? null : data?.result ?? null;
			}).catch(err => {
				console.error(err);
				if (err != null && 'response' in err && err.response.status === 401) {
					console.error("Connetion error");
				}
				throw err;
			});

		return {
			qr,
			connectionError: false,
		};
	} catch(e) {
		console.error(e);
		return {
			qr: null,
			connectionError: true,
		};
	}
};

const verifyProfile = async (profileUserId: string, backgroundUrl: string | null, profilePictureUrl: string | null): Promise<{profileUserId: string, qrResult: string | null, connectionError: boolean}> => {
	let qrResult: string | null = null;
	let connectionError = false;

	if ( backgroundUrl === 'default' ) {
		console.log("Background is the default and contains no QR.");
	}

	if ( profilePictureUrl === 'default' || profilePictureUrl === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' ) {
		console.log("Profile picture is the default and contains no QR.");
	}

	// First see if the background image contains a QR code.
	if ( !qrResult && backgroundUrl && backgroundUrl !== 'default' ) {
		// console.log("backgroundImageUrl", backgroundImageUrl);
		const {
			qr,
			connectionError: err,
		} = await fetchQRFromImage(backgroundUrl);

		if ( qr ) {
			verbose("QR in background: YES");
			qrResult = qr;
		} else {
			verbose("QR in background: NO");
		}

		if ( !qr && err ) {
			connectionError = true;
		}
	} else {
		verbose("Fetching QR result from background image: No background image found.");
	}

	// Second see if the profile image contains a valid QR code.
	if ( !qrResult && profilePictureUrl && profilePictureUrl !== 'default' && profilePictureUrl !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' ) {
		verbose("Fetching QR result from profile image");
		const profileImageUrl = profilePictureUrl;

		const {
			qr,
			connectionError: err
		} = await fetchQRFromImage(profileImageUrl);

		if ( qr ) {
			verbose("QR in background: YES");
			qrResult = qr;
		} else {
			verbose("QR in background: NO");
		}

		if ( !qr && err ) {
			connectionError = true;
		}
	}

	return {
		qrResult,
		connectionError,
		profileUserId,
	};
};

const ensureWidget = () => {
	logger.info("Adding mysome.id Widget");

	const nameElement = (document.querySelectorAll("h1")[0]) as any as HTMLElement;

	if (!nameElement || !nameElement.parentElement ) {
		logger.error("Failed to find profile name element - No Widget Anchor.");
		return null;
	}

	const widget = createShieldWidget(nameElement.parentElement, {
		onClicked: (state: string, proofUrl: string) => {
			console.log('Shield clicked', {state, proofUrl});
			(mysome as any).badgeClickHandler &&
			(mysome as any).badgeClickHandler({
				origin: 'shield',
				profile: 'other',
				proofUrl
			});
		},
	});

	verbose("Widget created", widget);

	widget.setInitialState();

	return widget;
};

(async () => {
	const staging = (await storage.get("staging", true)) ?? false;
	TEST = !!staging;
	console.log("test ", TEST);
})().then().catch(console.error);

const trackProofQR = createTracker<string | null>({
	name: 'proofQR',
});
const trackUrl = createTracker<string>({
	name: 'url',
	query: () => window.location.href,
});
const trackOnProfileUrl = createTracker<boolean>({
	name: 'onProfileUrl',
	query: () => !!isOnLinkedInProfileUrl()
});
const trackOnFeedUrl = createTracker<boolean>({
	name: 'onFeedUrl',
	query: () => isOnLinkedInFeedUrl()
})
const trackOnOwnProfileOrFeed = createTracker<boolean>({
	name: 'onOwnProfileOrFeed',
	query: () => onOwnLinkedInProfileOrFeedUrl(),
});
const trackOwnProfileName = createTracker<string | null>({
	name: 'ownProfileName'
});
const trackCurrentProfileName = createTracker<string | null>({
	name: 'currentProfileName'
});
const trackProfileUserId = createTracker<string | null>({
	name: 'profileUserId'
})
const trackProfileName = createTracker<string | null>({
	name: 'profileName'
});
const trackOwnProfileUserId = createTracker<string | null>({
	name: 'ownProfileUserIdObserved',
	mode: 'observed',
});
const trackOtherProfileUserId = createTracker<string | null>({
	name: 'otherProfile',
	mode: 'observed',
});
const trackHeader = createTracker<HTMLHeadingElement | null>({
	name: 'header',
});
const trackOnOwnFeed = createTracker<boolean>({
	name: 'onOwnFeed',
});
const trackOnOwnPage = createTracker<boolean>({
	name: 'onOwnPage',
});
const trackBackgroundUrl = createTracker<string | null>({
	name: 'backgroundUrl',
});
const trackVerifyStatus = createTracker<string | null>({
	name: 'verifyStatus',
});
const trackProfilePictureUrl = createTracker<string | null>({
	name: 'profilePictureUrl',
});
const trackPathname = createTracker<string | null>({name: 'route'});

const createHeartbeat = () => {
	// let updatePageStatus = false;
	const startTime = new Date().getTime();

	return () => {
		const timeSinceStart = new Date().getTime() - startTime;
		const {
			value: url,
			// dirty: urlChanged,
		} = trackUrl.update();

		const {
			value: pathname
		} = trackPathname.update({
			query: () => {
				return window.location.pathname ?? '';
			},
		});

		const {
			value: onProfileUrl,
		} = trackOnProfileUrl.update({
			// prerequisites: [urlChanged], // TODO: support input and prerequistes to optimise.
		});

		const {value: onFeedUrl} = trackOnFeedUrl.update({
			// prerequisites: [urlChanged],
		});

		const {
			value: onOwnPageOrFeed,
			dirty: onOwnPageOrFeedChanged,
		} = trackOnOwnProfileOrFeed.update({
			throttle: 1000,
			/*on: (value: boolean) => { // called when changed.
				if ( value ) {
					verbose("You are on your own profile.");
				} else {
					verbose("You are not on your own page");
				}
			}*/
		});

		trackOwnProfileName.update({
			throttle: 2000,
			query: () => {
				if ( !onProfileUrl && !onFeedUrl ) {
					// console.log("Not on feed url or profile url");
					return null;
				}
				if ( onProfileUrl ) {
					return getUsersNameOnProfile();
				}
				return getUsersNameOnFeed() ?? null;
			}
		});

		const {value: currentProfileName,} = trackCurrentProfileName.update({
			throttle: 2000,
			query: () => {
				if ( onProfileUrl ) {
					return getUsersNameOnProfile();
				} else if ( onFeedUrl ) {
					return getUsersNameOnFeed();
				}
				return null;
			},
		});

		const {
			value: profileUserId,
			// dirty: profileUserIdChanged,
		} = trackProfileUserId.update({
			/* prerequisites: [ // Only run if we are on a profile url or on the feed.
				trackOnProfileUrl.get() || trackOnFeedUrl.get(),
			],*/
			query: () => {
				if ( !onProfileUrl && !onFeedUrl ) {
					// console.log("Not on feed url or profile url");
					return null;
				}
				if ( onProfileUrl ) {
					const value = getUserIdInUrl();
					// console.log("resolved profile url profile name :"  + value);
					return value;
				} else if ( onFeedUrl ) {
					const value = getUserIdOnPageFeed();
					// console.log("resolved feed profile name :"  + value);
					return value;
				}
				return null;
			},
		});

		// This is observed just once.
		trackOwnProfileUserId.update({
			prerequisites: [
				!!onOwnPageOrFeed,
				profileUserId !== null,
				trackOwnProfileUserId.get() === null,
			],
			query: () => {
				console.log('ownProfile value : ' + trackOwnProfileUserId.get() );
				console.log('ownProfile new Value : ' + profileUserId );
				return profileUserId;
			},
		});

		// this tracks if we landed on the url of another user.
		/*trackOtherProfileUserId.update({
			throttle: 1000,
			prerequisites: [
				!onOwnPageOrFeed,
				onProfileUrl === true,
				!!profileUserId,
				timeSinceStart > 3000,
			],
			query: () => {
				if ( !!document.querySelector("button[aria-label=\"Edit intro\"]") ) {
					return null;
				}
				console.log('otherProfile new Value : ' + getUserIdInUrl() );
				return getUserIdInUrl();
			},
		});*/

		const {value: header, dirty: headerChanged} = trackHeader.update({
			throttle: 2000,
			// resetThrottle: profileUserIdChanged,
			query: () => {
				// console.log("checking header : " + onProfileUrl);
				if ( !onProfileUrl ) {
					return null;
				}
				const newHeader = document.querySelector("h1");
				//console.error("header : " + newHeader);
				return newHeader;
			},
			cmp: (header: HTMLHeadingElement | null, newHeader: HTMLHeadingElement | null) => {
				return !!((!header && newHeader) ||
							(header && !newHeader) ||
							(header && !header.isEqualNode(newHeader)));
			}
		});

		// update when the status of the header has changed.
		trackProfileName.update({
			prerequisites: [
				headerChanged
			],
			query: () => {
				if ( !header ) {
					return null;
				}
				return getUsersNameOnProfile() ?? null;
			},
		});

		const {value: backgroundUrl} = trackBackgroundUrl.update({
			throttle: 1000,
			resetThrottle: headerChanged,
			query: () => {
				if ( trackOnFeedUrl.get() ) {
					const el = qs("div.feed-identity-module__member-bg-image");
					const url = el ? [0].reduce((acc) => acc?.slice(0, acc.length - 2),
												el?.style.backgroundImage.replace("url(\"", "")) : null;
					return url;
				} else if ( trackOnProfileUrl.get() ) {
					const el = qs("#profile-background-image-target-image") as HTMLImageElement | null;
					if ( !el && qs('div.profile-background-image--default') ) {
						return 'default';
					}
					const url = el?.src ?? null;
					return url;
				}
				return null;
			},
		});

		const {value: profilePictureUrl} = trackProfilePictureUrl.update({
			throttle: 1000,
			resetThrottle: headerChanged,
			query: () => {
				if ( !onProfileUrl && !onFeedUrl ) {
					return null;
				}

				if ( onProfileUrl ) {
					const images = qsa("img.pv-top-card-profile-picture__image, img.profile-photo-edit__preview") as HTMLImageElement[];
					// verbose("Profile image url", images);
					if ( images.length > 0 ) {
						const profileImageUrl = images[0]?.src;
						if ( profileImageUrl === 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh' ) {
							const style = getComputedStyle(images[0]).backgroundImage;
							const url = images[0] ? [0].reduce((acc) => acc?.slice(0, acc.length - 2),
								getComputedStyle(images[0]).backgroundImage.replace("url(\"", "")) : null;
							return url;
						}
						return profileImageUrl;
					} else {
						const editPhoto = qs('.profile-photo-edit');
						if ( editPhoto ) {
							return 'default';
						}
					}
					return null;
				}

				if ( onFeedUrl ) {
					const smallProfileImageUrl = qs("img.feed-identity-module__member-photo") as HTMLImageElement | null;
					return smallProfileImageUrl?.src ?? null;
				}				

				return null;
			},
		});

		trackOnOwnFeed.update({
			throttle: 1000,
			resetThrottle: headerChanged,
			query: () => {
				/*console.log({
					onOwnPageOrFeed,
					trackOnFeedUrl: trackOnFeedUrl.get(),
					el: qs("div.feed-identity-module__member-bg-image"),
				});*/
				if ( !onOwnPageOrFeed ){
					return false;
				}
				if ( !trackOnFeedUrl.get() )  {
					return false;
				}
				if (qs("div.feed-identity-module__member-bg-image")) {
					return true;
				}
				return false;
			},
		});

		/* const {value: onOwnPage} = */ trackOnOwnPage.update({
			throttle: 1000, 
			query: () => {
				if ( !onOwnPageOrFeed || !onProfileUrl ){
					return false;
				}
				const el = qs("#profile-background-image-target-image") as HTMLImageElement | null;
				const backgroundImg = onProfileUrl ? el : qs('div.profile-background-image--default');
				return onProfileUrl && !!backgroundImg;
			},
		});

		// Set the status weather we should be updating verification. This can be used to trigger a verification
		trackVerifyStatus.update({
			// throttle: 250,
			query: () => {
				// console.log('trackVerifyStatus : ' + backgroundUrl);
				const ret = (onProfileUrl || onFeedUrl) &&
							((onProfileUrl && !!header) || onFeedUrl) &&
							((onProfileUrl && !!shield) || onFeedUrl) &&
							!!backgroundUrl &&
							!!profilePictureUrl &&
							!!profileUserId &&
							!!currentProfileName ?
								url + backgroundUrl + profilePictureUrl + profileUserId + currentProfileName : null;
				/* console.log('trackVerifyStatus : ', {
					"(onProfileUrl || onFeedUrl)": (onProfileUrl || onFeedUrl),
					'((onProfileUrl && !!header) || onFeedUrl)': ((onProfileUrl && !!header) || onFeedUrl),
					'((onProfileUrl && !!shield) || onFeedUrl)':((onProfileUrl && !!shield) || onFeedUrl),
					"!!backgroundUrl": backgroundUrl,
					"!!profilePictureUrl": profilePictureUrl,
					"!!profileUserId": profileUserId,
					ret
				});	*/
				return ret;
			},
		});
	};
}

const sleep = async (dt=1000) => new Promise(resolve => setTimeout(resolve, dt));

const changeBackgroundTour = {
	onTourStart: (tour: any) => {
		tour.background = createTourWidget();
		tour.background.show();
	},
	onTourDone: (tour: any) => {
		tour.background.hide();
	},
	onTourError: (tour: any) => {
		tour?.loadingPopup?.destroy();
	},
	onTourCancel: (tour: any) => {
		const u = getUserIdInUrl() ?? getUserIdOnPageFeed() ?? '';
		if ( u ) {
			registrations.setRegStep(mysome.platform, u, 6).then().catch(console.error);
			
		} else {
			console.error('No user id while cancelling tour - could not change the status of the registration.');
		}
	},
	steps: [
		{
			activate: async (tour: any) => {
				// Resolve the params that we want to open the popup
				const context = showFinalizePopup({
					u: getUserIdInUrl() ?? getUserIdOnPageFeed() ?? '',
					p: mysome.platform,
				});
				context.onResult = (v: any) => {
					if ( v === 'cancel' ) {
						tour.cancel();

					} else if ( v === 'continue' ) {
						tour.loadingPopup = showLoadingPopup({
							message: 'Changing your background',
							bgColor: '#000000FF'
						});
						tour.nextStep();
					}
				};
			},
		},
		{
			activate: async (tour: any) => {
				// console.log('# 1');
				let userId: string | null = null;
				userId = getUserIdInUrl();
				const loc = window.location.href.toLowerCase();
				const onProfile = loc.indexOf('/in/' + userId + '/' ) >= 0 &&
									qs('.profile-topcard-background-image-edit__icon');
				if (!onProfile) {
					console.log('# 2a');
					const onFeed = loc.indexOf('/feed/') >= 0;
					if ( !onFeed ) {
						document.querySelector<HTMLElement>("a.app-aware-link")?.click();
						let max = 0;
						while ( !document.querySelector(".feed-identity-module") ) {
							if ( max++ > 4 * 60) {
								throw new Error('Timed out')
							}
							await sleep(250);
						}
					}
					console.log('# 2b');

					const a = document.querySelector<HTMLElement>(".feed-identity-module")
								?.querySelector<HTMLElement>('a');
					a?.click();
					console.log('# 2c');
					if ( !a ) {
            console.error('Feed profile link not found.');
					}
					let max = 0;
					console.log('# 2d');
					while ( !document.querySelector(".profile-topcard-background-image-edit") ) {
						if ( max++ > 4 * 60) {
							throw new Error('Timed out')
						}
						await sleep(250);
					}
					console.log('# 2e');
				}


				console.log('# 2f');
				userId = getUserIdInUrl();
				if ( !userId ) {
					console.log('# 2g');
					tour.endWithError('Failed changing background (1)', 'Please try again later or change the background manually.');
					return;
				}

				const reg = registrations.select(mysome.platform, userId);
				console.log('# 2g');
				if ( !reg ) {
					tour.endWithError('Failed changing background (2)', 'Please try again later or change the background manually.');
					return;
				}

				console.log('# 3');
				const editBgButton = document.querySelector(".profile-topcard-background-image-edit")?.querySelector("button");
									 // document.querySelector<HTMLElement>(".profile-topcard-background-image-edit")?.querySelector<HTMLElement>("button");
				if ( !editBgButton ) {
					tour.endWithError('Failed changing background (3)', 'Please try again later or change the background manually.');
					return;
				}
				editBgButton?.click();

				// Give it some time to render.
				await sleep(250);

				console.log('# 4 - fetching stored background image');
				const {blob, imageType} = base64ToBlob(reg.image);
				const file = new File([blob], 'image.png', { type: imageType ?? 'image/png', lastModified: new Date().getTime()});
				const container = new DataTransfer(); 
				container.items.add(file);

				// Test what kind of view shows up.
				const changeBackgroundFound = qsa("div").find( x => x.innerText === 'Background photo' )?.parentElement?.parentElement?.qsa("label").find( x => x.innerText === "Change photo" );
				const addBackgroundViewFound = qsa("h2").find( x => x.innerText.trim() === 'Add background photo' );

				// 1. If we have not previously send a photo we need to detect if there is one available.
				const editProfileBackgroundButton = document.querySelector('[aria-label="Edit profile background"]');
				console.log({
					changeBackgroundFound,
					addBackgroundViewFound,
					editProfileBackgroundButton,
				});

				if ( !changeBackgroundFound && addBackgroundViewFound && editProfileBackgroundButton ) {			
					console.log('# 5a - We have not previously added a background picture');
					let max = 0;
					await sleep(1000);
					// profile-topcard-background-image_file-upload-input
					console.log('# 6a - Locating input');
					let input =  document.querySelector('input[aria-label="Edit profile background"]')
								?? Array.prototype.slice.call(document.querySelectorAll("input")).find ( x => x.accept === 'image/*' )
									?? null;
					if ( input ) {
						console.log('# 6a - dispatching change event.');
						input.files = container.files;
						input.dispatchEvent(new Event('change'));
					} else {
						console.error('Failed to locate element to add the image to.');
					}
				
					while ( !document.querySelector('footer.image-edit-tool-footer') ) {
						console.log('# 7a');
						await sleep(1000);
						if ( max++ > 30 ) {
							tour.endWithError('Failed changing background (4)', 'Please try again later or change the background manually.');	
							return;
						}
					}

					console.log('# 8a');

				} else { // 1. If we have already set a background image before we will be asked to 
					console.log('# 5b - We have previously set a background image.');
					let max = 0;
					while (!document.querySelector('footer.image-edit-tool-footer')) {
						if ( max++ > 4 * 60 ) {
							tour.endWithError('Failed changing background (4)', 'Please try again later or change the background manually.');
							return;
						}
						await sleep(250);
					}
				
					console.log('# 6b - find the input field.');
					let input = document.querySelector('.artdeco-modal')?.querySelector('input.visually-hidden')
									?? document.querySelector("input#background-image-cropper__file-upload-input.hidden")
										?? Array.prototype.slice.call(document.querySelectorAll('input')).filter( x => x.accept === 'image/*' )[0]
											?? null;
									 
					console.log("# 6b - Background picture input", input);
				
					if ( !input ) {
						tour.endWithError('Failed changing background (5)', 'Please try again later or change the background manually.');
						return;
					}

					console.log('# 7b');
					(input as any).files = container.files;
					input.dispatchEvent(new Event('change'));
					console.log("Background image changed");
				}

				console.log('# 8 - Apply');
				await sleep(1250);

				let notFnd = 0;
				while ( document.querySelector('footer.image-edit-tool-footer') ) {
					console.log('Getting Apply Button');
					const applyButton = Array.prototype.slice.call(document.querySelector('footer.image-edit-tool-footer')?.querySelectorAll('span'))
						?.filter(x => x.innerText?.indexOf('Apply') >= 0 )[0]
							?.parentElement;
					console.log('Apply Button resolved : ' + (!!applyButton ? 'Yes' : 'No'));
					if ( !applyButton ) {
						console.error("Apply button not found.");
						await sleep(1000);
						if ( notFnd ++ > 10 ) {
							console.error("Failed to find Apply button"); // TODO: Show error message to user.
							tour.endWithError('Failed to change background', 'Please try setting the background manually');
							return;
						} else {
							console.log("Retrying finding Apply Button");
						}
						continue;
					} else {
						if ( !applyButton ) {
							console.error("Error - cannot find apply button.");
						}
						console.log("Clicking Apply button", applyButton);
						applyButton?.click();
						console.log("Clicked the apply button");
					}
					let cnt = 0;
					// wait up to 30 seconds.
					while ( document.querySelector('footer.image-edit-tool-footer') && cnt++ < 30 ) {
						console.log("Waiting for apply to disappear");
						await sleep(1000);
					}
				}
				console.log('# 10');

				tour?.nextStep();
			},
			onActivateException: (tour: any) => {
				tour?.endWithError('Failed to change background', 'Please try setting the background manually');				tour?.nextStep();
			},
		},
		{
			activate: async (tour: any) => {
				// Resolve the params that we want to open the popup
				const u = getUserIdInUrl() ?? getUserIdOnPageFeed() ?? '';
				const args = objToUrlParms({
					u,
					p: mysome.platform,
					title: encodeURIComponent('Registration Done'),
					message: encodeURIComponent('Your profile is verified.'),
					primary: 'OK',
					secondary: '',
				});
				tour?.loadingPopup?.destroy();
				const context = mysome.createPopup("widget/index.html", `#/message?${args}`, {
					closeOnBgClick: false,
					bgColor: 'transparent',
				});
				context.onResult = (v: any) => {
					// Store the next step.
					registrations.setRegStep(mysome.platform, u, 6).then(() => {
						tour.done();
					}).catch((err) => {
						console.error(err);
						tour.endWithError('Failed updating registration', 'Please retry uploading background.');
					});
				};
			},
		},
	]
};

function showNotVerifiedPopup() {
	showMessagePopup({
		title: 'Your LinkedIn profile is not verified',
		message: 'Secure your account now by self-issuing a certificate to prove your account ownership.<br/><br/>The certificate contains a cryptographic proof used to let other know that you are who you claim to be to prevent risks of identity theft and fraud.',
		primary: 'SECURE PROFILE',
		secondary: 'CANCEL',
		primary_link: getCreateLink(),
	});
	storage.set("content-welcome-shown", true).then(() => {}).catch(console.error);
}

const validateProofWithProfile = async ({
	firstName,
	lastName,
	proofUrl,
	userData,
	platform,
}: {
	firstName: string;
	lastName: string;
	proofUrl: string;
	userData: string;
	platform: 'li';
}): Promise<{status: string | null}> => {
	const base = SERVICE_BASE_URL();
	proofUrl = encodeURIComponent(proofUrl);
	firstName = encodeURIComponent(firstName);
	lastName = encodeURIComponent(lastName);
	userData = encodeURIComponent(userData);
	const url =
		`${base}/proof/validate-proof-url?url=${proofUrl}&firstName=${firstName}&lastName=${lastName}&platform=${platform}&userData=${userData}`;

	return fetch(url).then(res => {
		return res.json();
	}).then(obj => {
		return obj ?? {status: null};
	});
}

const getCreateLink = () => {
	const template = 'template=' + encodeURIComponent(utf8_to_b64(JSON.stringify({
		userId: trackOwnProfileUserId.get(),
		platform: mysome.platform,
		name: trackOwnProfileName.get(),
		profilePicUrl: trackProfilePictureUrl.get(),
		backgroundPicUrl: trackBackgroundUrl.get(),
	})));
	const base = WEBSITE_BASE_URL();
	return `${base}/create/2?${template}`;
};

function showWelcomePopup() {
	showMessagePopup({
		title: 'Thank you for installing mysome.id',
		message: 'To get started you must link a proof of account ownership to your profile<br/><br/>Tip: If you need additional assistance, you can always click on the mysome.id shield or badge',
		className: 'badge-popup',
		primary: 'Create Proof',
		secondary: 'CANCEL',
		primary_link: getCreateLink(),
	});
	storage.set("content-welcome-shown", true).then(() => {}).catch(console.error);
}

const install = async () => {
	logger.info("Install linkedIn Hooks");

	getMessageHandler().addMessageHandler((data) => {
		const {
			type,
			// payload,
		} = data;
		switch(type) {
			case 'show-content-widget':
				(mysome as any)?.badgeClickHandler();
			break;
		}
	});

	root = createRootWidget();

	// How many times we have visited the website.
	nvisit = (await storage.get("li.nvisit")) ?? 0;
	await storage.set("li.nvisit", nvisit + 1);
	welcomeShown = await storage.get("content-welcome-shown");
	logger.info( "welcomeShown ", welcomeShown );
	(mysome as any).info = {
		welcomeShown,
		'li.nvisit': nvisit + 1,
	};

	// 
	const requestToFetchProfile = (await platformRequests.select('li', 'created', 'fetch-profile')) ?? null;
	(mysome as any).requests = requestToFetchProfile ?? [];
	console.log("requests", (mysome as any).requests);

	// 
	const regs = await registrations.fetch();
	console.log("registrations", regs);

	// 
	(mysome as any).tours = {
		'li.finalize': changeBackgroundTour,
	};

	tracking.on('ownProfileUserIdObserved', (userId: string) => {
		console.log("Own profile name obseved ", userId);
		mysome.onPlatformObserved(mysome.platform, userId); // when a user has been logging into the platform.

		const reqs = (mysome as any).requests;
		if ( reqs && reqs.length > 0 ) {
			console.log("requests", reqs);
			const req = reqs[0];
			platformRequests.removeRequests('li').then(() => {
				showMessagePopup({
					title: 'Get Profile Info',
					message: 'Do you want to secure your profile?',
					secondary: 'CANCEL',
					primary: 'Continue',
					primary_link: getCreateLink(),
				});
			});
			return;
		}

		const reg = registrations.select('li', userId );
		console.log("Own Profile registration: ", reg);
		if ( reg && reg.step === 5 ) {
			mysome.createTour('li.finalize');
		}
	});

	tracking.on('otherProfileObserved', (userId: string) => {
		const reg = registrations.select('li', userId );
		if ( reg && reg.step === 5 ) {
			console.error("Other profile observed but there is a registration! (this is not supposed to happen)", reg);
			showMessagePopup({
				title: 'Warning',
				message: "You have tried to create a proof for a profile which you dont have access to.<br/><br/>Log in to the profile to finalise the registration.",
				primary: "Okay",
			});
		}
	});

	const badgeClickHandler = (mysome as any).badgeClickHandler = (params: any) => {
		if ( shield && shield?.isLoading() ) {
			return;
		}

		const popups = countPopupsWithClassName('badge-popup');
		console.log('popups ', popups);
		
		if ( popups > 0 ) {
			console.log("ignored showing popup as one other popup is already shown.");
			return;
		}

		// Resolve the params that we want to open the popup
		const u = getUserIdInUrl() ?? getUserIdOnPageFeed() ?? '';

		let {
			proofUrl,
		} = params ?? {};

		if ( !proofUrl ) {
			proofUrl = state.proofUrl;
		}

		const proofId = proofUrl?.split('/')?.[4] ?? '';
		const proofKey = proofUrl?.split('/')?.[5] ?? '';
		const base = WEBSITE_BASE_URL();
		proofUrl = proofId && proofKey ? [base, trackOnOwnProfileOrFeed.get() ? 'my-proof' : 'v', proofId, proofKey ].join('/') : proofUrl;

		const onProfilePage = trackOnProfileUrl.get();
		const onOwnProfileOrFeed = trackOnOwnProfileOrFeed.get();
		const ownUserId = trackOwnProfileUserId.get();

		console.log("Badge clicked", {
			ownProfileUserIdbserved: ownUserId,
			status: profileStatus.get(),
			u,
			onProfilePage,
			onOwnProfileOrFeed,
			proofUrl,
		});

		// on another users profile page.
		if ( onProfilePage && !onOwnProfileOrFeed ) {
			if ( profileStatus.get() !== null ) {
				const status = profileStatus?.get()?.status ?? null;
				const statusMessage = statusToStatusMessage(status);

				const goto = status === 'registered' ? {
					goto_button: 'View Proof',
					goto_link: proofUrl,
					secondary: 'Back',
				} : {};

				showMessagePopup({
					title: 'Profile Status',
					message: statusMessage,
					className: 'badge-popup',
					primary: (status !== 'registered' ? 'Okay' : ''),
					...goto,
				});
			}

		} else if ( onOwnProfileOrFeed ) {
			if ( ownUserId !== null && profileStatus !== null ) {
				const tmp = profileStatus.get();
				const status = profileStatus.get()?.status ?? null;
				if ( status === 'not-registered' ) {
					const reg = registrations.select(mysome.platform, ownUserId);
					const {
						step 
					} = reg ?? {};

					if ( step === 5 ) {
						// Continue the installation process.
						console.log("Continue the installation process for LinkedIn: " + ownUserId);

						mysome.createTour('li.finalize');
						return;

					} else if ( step > 5 ) {
						
						const createLink = getCreateLink();
						showMessagePopup({
							title: 'Your Profile Status',
							message: "It seems that your profile is no longer verified.<br/><br/>To resolve this, you need to provide a new verification proof and attach it to your LinkedIn profile.",
							className: 'badge-popup',
							primary: 'Create Proof',
							secondary: 'CANCEL',
							primary_link: createLink,
						});
						return;

					} else if ( !reg ) {
						showNotVerifiedPopup();
						return;

					}
				}

				const goto = status === 'registered' ? {
					goto_button: 'View Proof',
					goto_link: proofUrl,
					secondary: 'Back',
					primary: '',
				} : {};

				const statusMessage = statusToStatusMessage(status);

				if ( !welcomeShown && status === 'not-registered' ) {
					showWelcomePopup();
				} else {
					console.log('Show status with info ', goto);
					showMessagePopup({
						title: 'Your Profile Status',
						message: statusMessage,
						className: 'badge-popup',
						primary: 'Okay',
						...goto,
					});
				}

	
			} else if ( !welcomeShown ) {
				showWelcomePopup();
	
			}
		} else {
		
		}
	};
	const badge = mysome.createBadge({showAttention: false});
	badge.addClickHandler(badgeClickHandler);

	// There is a background url.
	tracking.on('backgroundUrlChanged', (url: string | null) => {
		/*if ( onOwnPageOrFeed ) {
			const _s = ensureWidget();
			if ( _s ) {
				verifyProfile(_s, onOwnPageOrFeed);	
			}
		}*/
		/*setProfileStatusBackgroundUrl({
			...profileStatusObj,
			url
		});*/
	});

	tracking.on(trackProofQR.changeEventName, (proof: string | 'no-proof' | 'no-connection' | null) => {
		console.log('Proof changed : ' + proof);
		const onOwnPageOrFeed = !!tracking.onOwnProfileOrFeed;

		if ( proof && proof !== 'no-connection' && proof !== 'no-proof' ) {
			console.log('Proof observed', proof);
			state.proofUrl = proof;
			const userId = trackProfileUserId.get();
			const name = trackCurrentProfileName.get();
			const components = name?.split(' ') ?? [];
			const [firstNameOpt, ...lastNames] = components;
			const firstName = firstNameOpt ?? '';
			const lastName = lastNames.join(' ');

			validateProofWithProfile({
				firstName,
				lastName,
				proofUrl: state.proofUrl,
				userData: userId ?? '',
				platform: 'li',
			}).then(response => {
				const {
					status,
				} = response ?? {};
				console.log("VERIFY Result ", response );
				
				if ( status === 'valid' ) {
					shield?.setVerified(proof, onOwnPageOrFeed);
					badge.showAttention(false);
					setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'registered');	
				} else if (status === 'invalid' || status === 'suspecious' ) {
					shield?.setSuspeciousProfile(proof);
					badge.showAttention('error');
					setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'suspecious');	
				} else {
					console.error("Failed to evaluate the status of the proof.");
					messages.failedResolve = defaultMessages.failedResolve;
					shield?.setFailedResolve(proof, messages.failedResolve);
					badge.showAttention('warning');
					setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'failed-resolve');	
				}

			}).catch(err => {
				console.error("exception while evaluting status of proof", err);
				messages.failedResolve = err?.message ?? defaultMessages.failedResolve;
				shield?.setFailedResolve(proof, messages.failedResolve);
				badge.showAttention('warning');
				setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'failed-resolve');	

			});

		} else if ( proof === 'no-connection' ) {
			logger.info("No QR code detected - no connection to API");
			shield?.setNoConnection();
			badge.showAttention('warning');
			setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'no-connection');

		} else if ( proof === 'no-proof' ) {
			logger.info("No QR code detected - Profile not detected");
			onOwnPageOrFeed && shield?.setOwnProfileNotVerified();
			!onOwnPageOrFeed && shield?.setOtherProfileNotVerified();
			badge.showAttention('warning');
			setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'not-registered');

		} else {	
			logger.info("No QR code detected - Profile is not verified.");
			onOwnPageOrFeed && shield?.setOwnProfileNotVerified();
			!onOwnPageOrFeed && shield?.setOtherProfileNotVerified();
			badge.showAttention(false);
			setProfileStatusResolved( 'profile', onOwnPageOrFeed ? 'own' : 'other', 'not-registered');
		}
	});

	tracking.on(trackUrl.changeEventName, (url: string) => {
		console.log("New url : ", url);
		if ( url.indexOf('/in/') > 0 ) {
			badge.show();
		} else if ( url.indexOf('/feed/') > 0 ) {
			badge.show();
		} else {
			badge.hide();
		}		
	});	

	tracking.on(trackPathname.changeEventName, (pathName: string) => {
		// If we are on the homescreen with the login form visibile then
		// we find an open registration created less than 30 seconds ago
		// and show a message to tell the user to login to continue their
		// registration.
		if ( (pathName === '/home' || pathName === '/') && !!document.querySelector('form[data-id="sign-in-form"]') ) {
			platformRequests.fetch().then(requests => {
				console.log("requests", requests);
				const foundReq = requests.find(x => {
					const deltaTime = ((new Date().getTime() - x.created) / 1000);
					return x.platform === 'li' &&
							x.status === 'created' &&
							deltaTime < 30; 
				} );
				if ( foundReq ) {
					showMessagePopup({
						title: 'Secure Your Profile',
						message: 'Log in to secure your profile with mysome.id',
						primary: 'Okay'
					});
				}
			});
		}
	});

	tracking.on(trackHeader.changeEventName, (header: HTMLHeadingElement | null) => {
		verbose("Header: updated");
		if ( header ) {
			verbose("Header: Aquired header"); //, {preHeader, newHeader: header});
			shield = ensureWidget();
		} else if ( !header ) {
			verbose("Header: Lost header"); //, {preHeader, newHeader: header});
			shield?.hide();
		} else {
			verbose("Header: changed"); //, {preHeader, newHeader: header});
		}
	});

	tracking.on(trackProfileUserId.changeEventName, (profileUserId: string | null) => {
		console.log("Profile user id changed : ", profileUserId);
	});

	tracking.on(trackVerifyStatus.changeEventName, (verifyStatus: string | null) => {
		if ( !verifyStatus ) {
			trackProofQR.update({
				query: () => null,
			});
			return;
		}

		// Reset proof to null if needed.
		trackProofQR.update({
			query: () => null,
		});

		const profileUserId = trackProfileUserId.get();
		if ( !profileUserId ) {
			trackProofQR.update({
				query: () => null,
			});
			return;
		}
		if ( !shield && trackOnProfileUrl.get() ) {
			throw new Error('Shield is supposed to be initialised.');
		}
		const backgroundImageUrl = trackBackgroundUrl.get();
		const profilePictureUrl = trackProfilePictureUrl.get();
		// const onOwnPageOrFeed = !!tracking.onOwnProfileOrFeed;
		if ( shield && trackOnProfileUrl.get() ) {
			shield.setInitialState();
		}
		verifyProfile(profileUserId, backgroundImageUrl, profilePictureUrl).then(({profileUserId, qrResult, connectionError}) => {
			console.log('Profile verification result ', {qrResult, connectionError});

			verbose("qrResult" , qrResult);
			if ( trackProfileUserId.get() === profileUserId ) {
				if ( qrResult ) {
					connectionError = false;
					trackProofQR.update({
						query: () => qrResult
					});
				} else {
					trackProofQR.update({
						query: () => !connectionError ? 'no-proof' : 'no-connection'
					});
				}
			} else {
				throw new Error('Profile has changed during verification');
			}

			// verificationStatus
		}).catch(console.error);
	});

	tracking.on(profileStatus.changeEventName, (ps: ProfileStatus) => {
		const {page, status} = ps;
		console.log('Profile status changed ', ps);
		if ( status === 'no-connection' ) {
			// console.log('Status ', status);
			// badge.showAttention(false); // Make sure that badge is not shown.
			return;
		}
		// badge.showAttention(page !== 'other' && (status === 'not-registered' || status === 'suspecious'));
	});

	const check = createHeartbeat();
	check();
	window.setInterval( check, 250 );

	return {
	};
}

export default install;
