import {
	logger,
} from '@mysomeid/chrome-ext-shared';

import {
	createRootWidget,
} from '../root';

import {
	createTourWidget,
} from '../tour';

const injectCode = async () => {
	logger.info("Install test page hooks");

	createRootWidget();

	const tour = createTourWidget();
	const el = window.document.getElementById("test-div");
	if ( el ) {
		tour.show(el);
	}

	return {
	};
}

export default injectCode;
