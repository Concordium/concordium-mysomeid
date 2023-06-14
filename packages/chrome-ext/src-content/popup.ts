
import { getMessageHandler } from './content-messaging';

import { mysome } from './root';

import {
	objToUrlParms,
} from './utils';

let numPopups = 0;

export const countPopupsWithClassName = (className: string): number => {
	let cnt = 0;
	for( const widget of Object.entries(mysome.widgets) ) {
		cnt += widget[1].className === className ?  1 : 0;
	}
	return cnt;
}

export const createPopup = (src: string, route: string = '#/home', options?: any, className=''): any => {
	if (numPopups > 0) {
		console.error("Showing more than one popup.");
	}
	numPopups++;
	const {
		closeOnBgClick = true,
		bgColor = '#c9c9c966',
	} = options ?? {};
	const id = Math.round(Math.random() * 9999999999999);
	mysome.widgets[id] = {
		id,
		src,
		route,
		className,
		created: false,
		creating: true,
		onResult: null as ((result: any) => void) | null,
	};
	(async () => {
		if (!src) {
			src = 'widget/index.html';
		}

		const messageHandler = getMessageHandler();

		const response = await messageHandler.sendMessageWResponse('background', 'get-url', {
			file: src,
		});

		const url = response.payload.url + route;
		console.log("url ", url);

		const e = document.createElement('div');
		// let destroyed = false;  
		let created = false;
		e.id = `mysome-frame-${id}`;
		e.innerHTML = `
			<div id="mysome-frame-container-${id}" style="position: fixed;left: 0;top: 0;right: 0;bottom: 0;z-index: 999999;background: ${bgColor};display: flex;align-items: center;place-content: center; border: none;">
			  	<div id="mysome-frame-view-${id}" style="background: white;max-width: 380px;height: 556px;border-radius: 4px;box-shadow: 0px 1px 34px 9px rgba(0,0,0,0.27);width: 80%;position: fixed;color: black;border-radius: 10px; overflow: hidden;">
					<iframe id="mysome-frame-iframe-${id}" allow src="${url}" style="width: 100%; height: 100%; border: none;">
					</iframe>
		  		</div>
			</div>
	  	`;
		document.body.appendChild(e);
		// const container = document.getElementById(`mysome-frame-container-${id}`);
		const frameView = document.getElementById(`mysome-frame-view-${id}`);
		const overlay = document.getElementById(`mysome-frame-container-${id}`);
		const iframe = document.getElementById(`mysome-frame-iframe-${id}`) as HTMLIFrameElement;

		if (!frameView) {
			throw new Error('No frame view');
		}

		const overlayClicked = (e: any) => {
			if (!closeOnBgClick)
				return;
			console.log("Overlay clicked");
			mysome.widgets[id].destroy();
		};

		overlay?.addEventListener("click", overlayClicked);

		frameView.style.opacity = '0';

		let cnt = 0;
		let interval: any | undefined;
		interval = setInterval(() => {
			if (cnt++ > 30) {
				console.error('Timed out opening window - this happens if you close the popup before its fully shown.');
				clearInterval(interval);
				return;
			}
			if (created) {
				return;
			}
			messageHandler.sendMessage("injected-widget", "widget-create", {
				id,
			});
		}, 100);

		mysome.widgets[id].e = e;
		mysome.widgets[id].iframe = iframe;
		mysome.widgets[id].url = url;
		mysome.widgets[id].destroy = () => {
			numPopups--;
			const parent = e.parentElement as HTMLElement;
			if (!parent) {
				console.error("no parent element of widget.");
			}
			overlay?.removeEventListener("click", overlayClicked);
			parent?.removeChild(e);
			if (mysome.widgets[id]) {
				delete mysome.widgets[id];
			}
		};
		mysome.widgets[id].setCreated = () => {
			console.log("widget now created");
			created = true;
			mysome.widgets[id].created = true;
			mysome.widgets[id].creating = false;
			frameView.style.opacity = 'initial'; // show the container.
			clearInterval(interval);
		};
	})();
	return mysome.widgets[id];
};

export function showFinalizePopup(popupInfo: { u: string, p: 'li' }) {
	const args = objToUrlParms(popupInfo);
	const context = mysome.createPopup("widget/index.html", `#/finalize?${args}`, { closeOnBgClick: false, bgColor: 'transparent' });
	return context;
}

// goto_button: '1',
// goto_link: `https://app.mysomeid.dev/view/ad70d401b36cc787aac949f14c9f32215fb897235856112c049d150ed1826f25`,

type ShowMessagePopupArgs = {
	platform?: string | undefined;
	title: string;
	message: string;
	className?: string;
	primary?: string;
	secondary?: string;
	primary_link?: string;
	goto_button?: string;
	goto_link?: string;
};

export function showMessagePopup({ platform, title, message, className, primary, secondary, primary_link, goto_button, goto_link }: ShowMessagePopupArgs): any {
	const args = objToUrlParms({
		u: '1', // Dummy value. TODO: Get rid of this.
		p: platform ?? 'li', // TODO: get rid of this.
		title: encodeURIComponent(title),
		message: encodeURIComponent(message),
		primary: encodeURIComponent(primary ?? ''),
		secondary: encodeURIComponent(secondary ?? ''),
		...(primary_link ? { primary_link: encodeURIComponent(primary_link) } : {}),
		...(goto_button ? { goto_button, goto_link: encodeURIComponent(goto_link ?? '') } : {}),
	});
	const popupWidget = mysome.createPopup("widget/index.html", `#/message?${args}`, {
		closeOnBgClick: true,
		// bgColor: 'transparent',
	}, className ?? 'popup');
	return popupWidget;
}

export function showLoadingPopup(params: {
	title?: string,
	message: string,
	bgColor?: string,
}) {
	const {
		title = 'Loading',
		message = 'Changing your background',
		bgColor = 'transparent',
	} = params;
	const args = objToUrlParms({
		u: '1',
		p: 'li',
		title,
		message,
		primary: null,
		loading: '1',
		secondary: null,
	});
	return mysome.createPopup("widget/index.html", `#/message?${args}`, {
		closeOnBgClick: false,
		bgColor
	});
}
