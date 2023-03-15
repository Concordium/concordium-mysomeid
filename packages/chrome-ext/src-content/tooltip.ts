import {
	logger,
	verbose,
} from './utils';

export type TooltipWidget = {
	elements: Record<string, HTMLElement>;
	show: (e: HTMLElement) => void;
	hide: () => void;
};

let instance: TooltipWidget | null = null;

export const createTooltipWidget = (): TooltipWidget => {
	if ( instance ) {
		return instance;
	}

	const tooltipBgColor = "white";
	const tooltipTextColor = "black";
	const borderColor = "#777777";

	const elementId = "mysome-tooltip";
	let root = document.getElementById(elementId);
	if ( !root ) {
		root = document.createElement('div');
		root.id = elementId;
		root.innerHTML = `
			<style>
			.tour-tooltip {
			  position: absolute;
			  left: 100px;
			  top: 100px;
			  display: inline-block;
			  z-index: 9999999;
			}

			.tour-tooltip .tour-tooltiptext {
			  visibility: visible;
			  width: 120px;
			  background-color: ${tooltipBgColor};
			  color: ${tooltipTextColor};
			  text-align: center;
			  padding: 5px 0;
			  border-radius: 2px;
			  border: 1px solid ${borderColor};
			  position: absolute;
			  z-index: 1;
		      filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
			}
			
			.tour-tooltip .tour-tooltiptext::before {
			  content: " ";
			  position: absolute;
			  top: 100%;
			  left: 50%;
			  margin-left: -10px;
			  border: 10px solid;
			  border-color: ${borderColor} transparent transparent transparent;
			}

			.tour-tooltip .tour-tooltiptext::after {
			  content: " ";
			  position: absolute;
			  top: 100%;
			  left: 50%;
			  margin-left: -9px;
			  border: 9px solid;
			  border-color: ${tooltipBgColor} transparent transparent transparent;
			}
			</style>
			<div id="tour-tooltip" class="tour-tooltip">
			  <span class="tour-tooltiptext">Tooltip text</span>
			</div>
		`;
		const mysome = document.getElementById("mysome-root");
		if ( !mysome ) 
			throw new Error("Cannot find mysome" );
		mysome.appendChild(root);
	}

	const tooltip = document.getElementById("tour-tooltip");
	const tooltipText = document.querySelector(".tour-tooltiptext" );

	if ( !root || !tooltip || !tooltipText ) {
		throw new Error("missing element(s)");
	}

	let target: HTMLElement | null = null;
	let updateTimer: any;

	const update = () => {
		if ( !target ) {
			return;
		}

		const rect = target.getBoundingClientRect();
		const ttRect = tooltipText.getBoundingClientRect();

		// Point at mid top.
		const x = Math.round(rect.x + (rect.width / 2));
		const y = Math.round(rect.y);

		tooltip.style.left = `${x}px`;
		tooltip.style.top = `${y}px`;

		tooltip.style.marginTop = `-${(ttRect.height) + 14}px`;
		tooltip.style.marginLeft = `-${ttRect.width / 2}px`;
	};

	const show = (e: HTMLElement) => {
		if ( !root ) {
			throw new Error('No root');
		}
		target = e;
		root.style.display = "initial";
		updateTimer = setInterval(update, 25);
	};

	const hide = () => {
		if ( !root ) {
			throw new Error('No root');
		}
		root.style.display = "none";
		clearInterval(updateTimer);
	};

	instance = {
		elements: {
			root: root,
		},
		show,
		hide,
	};

	return instance;
};


