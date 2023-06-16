import {
	logger,
} from '@mysomeid/chrome-ext-shared';

import {
	// TourWidget,
	createTourWidget,
	createTour,
	endTour,
} from './tour';

import {
	// FrameWidget,
	createFrameWidget,
} from './frame';

import {
	// FrameWidget,
	createPopup,
} from './popup';

import {
	// ShieldWidget,
	createShieldWidget,
} from './shield';

/*import {
	// PopupWidget,
	popupWidget as createPopupWidget,
} from './popup';**/

import {
	createBadge
} from './badge';
import { getMessageHandler } from './content-messaging';

export type RootWidget = {
	elements: Record<string, HTMLElement>;
	methods: any;
};

let instance: RootWidget | null = null;

export const getRootWidget = (): RootWidget => {
	if ( !instance ) {
		throw new Error("No root");
	}
	return instance;
};

export const createRootWidget = (): RootWidget => {
	logger.log("creating root");
	if ( instance ) {
		return instance;
	}

	let root = document.getElementById("mysome-root");
	if ( !root ) {
		root = document.createElement('div');
		root.id = "mysome-root";
		root.innerHTML = `
			<style>
			</style>
			<div id="mysome-dummy"></div>
		`;
		document.body.appendChild(root);

	} else {
		logger.error("Root element already existed! This may make the plugin stop working.");
	}

	instance = {
		elements: {
			root,
		},
		methods: {
			createTourWidget,
			createFrameWidget,
			createPopupWidget: createPopup,
			createShieldWidget,
		},
	};

	(window as any).mysomeid = instance;
	logger.log("Created root");

	return instance;
};

const onPlatformObserved = (platform: string, userName: string) => {
	const messageHandler = getMessageHandler();
	messageHandler.sendMessageWResponse('background', 'set-platform-observed', {
		platform,
		userId: userName,
	}).then().catch(logger.error);	
};

export const mysome = {
	widgets: {} as Record<string | number, any>,
	createTour: createTour,
	endTour,
	createPopup: createPopup,
	createShield: createShieldWidget,
	createBadge,
	tour: null as any | null,
	regs: null as Record<string, any> | null,
	onPlatformObserved,
	platform: 'li' as 'li',
};

