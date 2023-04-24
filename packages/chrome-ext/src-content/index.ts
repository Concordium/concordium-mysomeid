/* eslint-disable */
console.log("MySoMe extension");
import injectLinkedInSnippet from './integrations/linked-in';
import injectTestPageSnippet from './integrations/test';
import injectMySoMeIdAPI from './integrations/mysome-api';
import {
	detectPlatform,
	logger,
	storage,
} from './utils';
import {
	getMessageHandler 
} from './content-messaging';
import {
	mysome
} from './root';

const platform = detectPlatform();

// Expose the object to the console so we can run commands on it.
(window as any).mysome = mysome;

if ( platform !== null ) {
	console.log("Creating message handler");
	const messageHandler = getMessageHandler();
	messageHandler.addMessageHandler((data: any) => {
		const {
			type,
			payload,
		} = data;
		switch(type) {
			case 'create-badge':
				mysome.createBadge({showAttention: false});
			break;
			case 'create-tour': 
				mysome.createTour('li.change-background');
			break;
			case 'redirect':
				if ( payload?.url ) {
					console.log("Redirecting url ", {url: payload?.url});
					window.location.href = payload.url;
				} else {
					console.error('Redirect requested - but no url given : ', payload);
				}
			break;
			case 'open-url': 
			{
				if ( payload?.url ) {
					console.log("Opening url ", {url: payload.url});
					window.open(payload.url, '_blank');
				} else {
					console.error('Open url requested - but no url given : ', payload);
				}
			}
			break;

			case 'close-widget':
			{			
				const {
					id,
					result,
				} = payload;
				if ( !mysome.widgets[id]  ) {
					console.error("Error finding widget with id " + id );
					return;
				};
				mysome.widgets[id].onResult &&
					mysome.widgets[id].onResult(result);
				mysome.widgets[id].destroy();
			}
			break;

			case 'widget-created':
			{
				const {
					id
				} = payload;
				if ( !mysome.widgets[id]  ) {
					console.error("No widget exists with : " + id);
					return;
				};
				mysome.widgets[id].setCreated();
			}
			break;

		}
	});
	injectMySoMeIdAPI();
	(async () => {
		try {
			await storage.init();
		} catch(e) {
		}

		if ( platform === 'li' ) {
			logger.info("MySoMeId: Injecting plugin into LinkedIn!");
			await injectLinkedInSnippet();
		} else if ( platform === 'test' ) {
			logger.log("MySoMeId: Injecting plugin into Test page!");
			await injectTestPageSnippet();
		}
	})().then().catch(console.error);
}




