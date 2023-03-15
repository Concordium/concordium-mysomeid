import {
	logger,
	verbose,
	utf8_to_b64,
	// isOnLinkedInProfileUrl,
	getPlatform,
	getUserIdInUrl,
	getUrlToCreateProof,
} from './utils';

// import {default as iframeContent} from '!base64-inline-loader!./data/wiki.html';
// import {default as iframeContent} from '!base64-inline-loader!./frame/index.html';

export type FrameWidget = {
	elements: Record<string, HTMLElement>;
	setInitialState: () => void;
	hide: () => void;
	show: () => void;
};

export const createFrameWidget = (url: string): FrameWidget => {
	let created = false;
	let setup = false;

	const iframeContent = url; /* "data:text/html;base64," + utf8_to_b64(`
		<head>
			<script type="text/javascript">
				console.log("iframe content");
			</script>
		</head>
		<body>
			<div>
				sadasdsa
			</div>
		</body>
	`);*/
	
	if ( !document.getElementById("mysome-frame-root") ) {
		const elem = document.createElement('div');
		elem.id = "mysome-frame-root";
		elem.innerHTML = `
			<style>
			</style>
			<div id="mysome-frame-container" style="position: fixed;left: 0;top: 0;right: 0;bottom: 0;z-index: 9999;background: #c9c9c966;display: flex;align-items: center;place-content: center;">
				<div id="mysome-frame-view" style="background: white;max-width: 380px;height: 522px;border-radius: 4px;box-shadow: 0px 1px 34px 9px rgba(0,0,0,0.27);width: 80%;position: fixed;color: black;border-radius: 10px;">
					<iframe src="${iframeContent}" title="description" style="width: 100%; height: 100%"></iframe>
				</div>
			</div>
			`;
		created = true;
		document.body.appendChild(elem);

	} else {
		logger.error("Root element already existed! This may make the plugin stop working.");
	}

	const root = document.getElementById("mysome-frame-root");
	if ( !root ) {
		throw new Error("No widget found.");
	}

	if ( !setup ) {
		/*let btn = document.getElementById("mysome-frame-close-button") as HTMLButtonElement;
		btn.addEventListener("click", () => {
			const root = document.getElementById("mysome-frame-root");
			if ( root ) {
				root.style.display = "none";
			}
		});
		btn = document.getElementById("mysome-frame-create-button") as HTMLButtonElement;
		btn.addEventListener("click", () => {
			const linkUrl = getUrlToCreateProof();
			if ( linkUrl ) {
				window.open(linkUrl, "_blank");
			}
		});*/
		setup = true;
	}
	
	return {
		elements: {
			root: root,
		},
		setInitialState: () => {
		},
		hide: () => {
			root.style.display = 'none';
		},
		show: () => {
			root.style.display = 'inline-block';
		},
	}
};


