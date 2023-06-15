declare var chrome: any;

let apiCreated = false;

const fnc = () => {
	console.log("Injecting MySoMe API");
	if ( apiCreated ) {
		throw new Error('API already created');
	}

	const scriptElement = document.createElement("script");
	scriptElement.id = "mysomeid-injected-script";
	scriptElement.type = "text/javascript";
	scriptElement.src = chrome.runtime.getURL("injected/index.js");
	(document.head || document.documentElement).appendChild(scriptElement);

	apiCreated = true;
}

export default fnc;