import {
	logger,

} from './utils';
import {
	mysome
} from './root';
import {
	showMessagePopup
} from './popup';

export type TourWidget = {
	elements: Record<string, HTMLElement>;
	setTarget: (e: HTMLElement) => void;
	setInitialState: () => void;
	hide: () => void;
	show: (e: HTMLElement | null) => void;
};

let instance: TourWidget;

const setStyle = (e: any, style: any) => {
	for ( const key of Object.keys(style) ) {
		const value = style[key];
		e.style[key] = value;
	}
};

function getWindowSize(): { w: number; h: number } {
  const w = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  );
  const h = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );
  return { w, h }
}

export const createTourWidget = (): TourWidget => {
	if (instance) {
		return instance;
	}

	const rootElemName = "mysome-tour-root";
	// const overlayClass = "mysome-tour-overlay";	
	// const overlayFocusClass = "mysome-tour-focus";	

	const focus = {
		width: 110,
		height: 90,
		left: 142,
		top: 90,
	};

	const maskID = "mysome-tour-mask";
	const clipID = "mysome-tour-clip";

	let root = document.getElementById(rootElemName);
	if ( !root ) {
		root = document.createElement('div');
		root.id = rootElemName;
		root.style.display = "none";
		root.innerHTML = `
			<style>
			</style>

			<div id="mysome-tour-overlay-container" style="opacity: 0.7; left: 0px; top: 0px; position: fixed; z-index: 99999; pointer-events: none; color: rgb(0, 0, 0);">
			   <svg id="mysome-tour-overlay-svg" width="1280" height="526" xmlns="http://www.w3.org/2000/svg" style="width: 1280px; height: 526px; left: 0px; top: 0px; position: fixed;">
			      <defs>
			         <mask id="${maskID}">
			            <rect id="${maskID}-rect1" x="0" y="0" width="1280" height="526" fill="white"></rect>
			            <rect id="${maskID}-rect2" style="x: 390px; y: 240.203px; width: 500px; height: 86px; fill: black; rx: 0px;"></rect>
			         </mask>
			         <clipPath id="${clipID}">
			            <polygon id="${clipID}-poly" points="0 0, 0 526, 390 526, 390 240.203125, 890 240.203125, 890 326.203125, 390 326.203125, 390 526, 1280 526, 1280 0"></polygon>
			         </clipPath>
			      </defs>
			      <rect id="mysome-tour-real-mask" style="x: 0px; y: 0px; width: 1280px; height: 526px; fill: currentcolor; mask: url(&quot;#mysome-tour-mask&quot;);"></rect>
			      <rect id="mysome-tour-clickable" style="x: 0px; y: 0px; width: 1280px; height: 526px; fill: currentcolor; pointer-events: auto; clip-path: url(&quot;#mysome-tour-clip&quot;);"></rect>
			      <rect id="mysome-tour-highlight" style="x: 390px; y: 240.203px; width: 500px; height: 86px; pointer-events: auto; fill: transparent; display: none;"></rect>
			   </svg>
			</div>

		`;
		document.body.appendChild(root);
	} else {
		logger.error("Root element already existed! This may make the plugin stop working.");
	}

	const container = document.getElementById("mysome-tour-overlay-container");
	const svg = document.getElementById("mysome-tour-overlay-svg") as any;
	const mask = document.getElementById("mysome-tour-mask") as any;
	const rect1 = document.getElementById("mysome-tour-mask-rect1") as any;
	const rect2 = document.getElementById("mysome-tour-mask-rect2") as any;
	const poly = document.getElementById("mysome-tour-clip-poly") as any;
	const realMask = document.getElementById("mysome-tour-real-mask") as any;
	const clickable = document.getElementById("mysome-tour-clickable") as any;
	const highlight = document.getElementById("mysome-tour-highlight") as any;

	if ( !svg || !mask || !rect1 || !rect2 || !poly || !realMask || !clickable || !highlight ) {
		throw new Error("Cannot find element.");
	}

	let target: HTMLElement | null = null;
	const setTarget = (element: HTMLElement): void => {
		target = element;
		console.log("set target" , target );
	};

	const maskArea = {
		x: 0,
		y: 0,
		w: 0,
		h: 0,
	};

	const update = () => {
		// console.log("update ");
		if ( target ) {
			const domRect: DOMRect = target.getBoundingClientRect();	
			maskArea.x = domRect.x;	
			maskArea.y = domRect.y;	
			maskArea.w = domRect.width;	
			maskArea.h = domRect.height;	
		} else {
			maskArea.x = 0;
			maskArea.y = 0;
			maskArea.w = 0;
			maskArea.h = 0;
		}

		const {
			w: overlayWidth,
			h: overlayHeight,
		} = getWindowSize();

		const windowHeight = overlayHeight;
		const windowWidth = overlayWidth;

		setStyle(svg, {
			width: `${overlayWidth}px`,
			height: `${overlayHeight}px`,
			left: '0px',
			top: '0px',
		});

		setStyle(rect1, {
			x: '0',
			y: '0',
			width: `${overlayWidth}px`,
			height: `${overlayHeight}px`,
			fill: 'white',
		});

		setStyle(rect2, {
			x: `${maskArea.x}`,
			y: `${maskArea.y}`,
			width: `${maskArea.w}`,
			height: `${maskArea.h}`,
			fill: 'black',
		});

		const strPoints = `
			0 0,
			0 ${windowHeight},
			${maskArea.x} ${windowHeight},
			${maskArea.x} ${maskArea.y},
			${maskArea.x + maskArea.w} ${maskArea.y},
			${maskArea.x + maskArea.w} ${maskArea.y + maskArea.h},
			${maskArea.x} ${maskArea.y + maskArea.h},
			${maskArea.x} ${windowHeight},
			${windowWidth} ${windowHeight},
			${windowWidth} 0`.replaceAll("\t", "").replaceAll("\n", "").replaceAll(",", ", ");
		poly.setAttribute("points", strPoints);

		setStyle(realMask, {
			x: '0',
			y: '0',
			width: windowWidth.toString(),
			height: windowHeight.toString(),
			fill: 'currentcolor',
			mask: `url(#${maskID})`,
		});

		setStyle(clickable, {
		    x: "0",
		    y: "0",
		    width: windowWidth.toString(),
		    height: windowHeight.toString(),
		    fill: 'currentcolor',
		    pointerEvents: 'auto',
		    clipPath: `url(#${clipID})`,
		});

		setStyle(highlight, {
	        x: maskArea.x.toString(),
		    y: maskArea.y.toString(),
		    width: maskArea.w.toString(),
		    height: maskArea.h.toString(),
		    pointerEvents: 'auto',
		    fill: 'transparent',
		    display: 'none',
		});
	};

	let updateTimer: any;

	const show = (e: HTMLElement | null) => {
		if(!root) {
			return;
		}
		target = e;

		root.style.display = 'inline-block';
		// createTooltipWidget().show(e);

		clearInterval(updateTimer);
		window.removeEventListener("resize", update);

		update();
		updateTimer = setInterval(update, 25);
		window.addEventListener("resize", update);	
	};

	const hide = () => {
		clearInterval(updateTimer);
		window.removeEventListener("resize", update);
		if(!root) {
			return;
		}
		root.style.display = 'none';
	};

	instance = {
		elements: {
			root: root,
		},
		setTarget,
		setInitialState: () => {
		},
		hide,
		show,
	};

	return instance;
};

export const createTour = (type: string): void => {
	// (mysome as any).tours = (mysome as any).tours ?? [];
	const {
		steps,
		onTourStart,
		onTourDone,
		onTourError,
		onTourCancel,
	} = (mysome as any).tours[type];
	let step = 0;
	let context = steps[step];
	(mysome as any).tour = {
		step,
		steps,
		type,
		cancel: () => {
			context.deactivate &&
				context.deactivate((mysome as any).tour).then().catch(console.error);			
			onTourCancel((mysome as any).tour);
			onTourDone((mysome as any).tour);
			context = null;
			(mysome as any).tour = null;
		},
		done: () => {
			context.deactivate &&
				context.deactivate((mysome as any).tour).then().catch(console.error);			
			onTourDone((mysome as any).tour);
			context = null;
			(mysome as any).tour = null;
		},
		nextStep: () => {
			context?.next && context.next();
		},
		next: () => {
			context?.next && context.next();
		},
		endWithError: (title: string, message: string) => {
			try {
				context.deactivate &&
 					context.deactivate((mysome as any).tour).then().catch(console.error);			
				onTourDone((mysome as any).tour);
				context = null;
			} catch(e) {
				console.error(e);
			}
			try {
				onTourError((mysome as any).tour);
			} catch(e) {
				console.error(e);
			}
			(mysome as any).tour = null;
			showMessagePopup({title, message});
		},
	};
	onTourStart((mysome as any).tour);
	context.activate &&
		context.activate((mysome as any).tour).then().catch((e: any) => {
			console.error(e);
			context?.onActivateException((mysome as any).tour);
		});
	let next: any;
	context.next = next = () => {
		context.deactivate &&
			context.deactivate((mysome as any).tour).then().catch(console.error);
		if ( ++step >= steps.length) {
			onTourDone((mysome as any).tour);
			context = null;
			(mysome as any).tour = null;
		} else {
			context = steps[step];
			context.next = next;
			(mysome as any).tour.step = step;
			context.activate &&
				context.activate((mysome as any).tour).then().catch((e: any) => {
					console.error(e);
					context?.onActivateException((mysome as any).tour);
				});
		}		
	};
}

export const endTour = () => {
	const {
		background
	} = (mysome as any).tour ?? {};
	background?.hide();
};
