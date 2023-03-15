import attentionSvg from './attention.svg';

import logoSvg from './logo.svg';

import {
	mysome 
} from './root';

export const createBadge = ({showAttention: showAttention = false}: {showAttention?: boolean}) => {
	const id = "mysome-badge";
	if ( document.getElementById(id) ) {
	  return;
	}
	const e = document.createElement('div');
	e.id = id;
	const top = ''; // 'top: calc(50% - 32px)';
	const bottom = 'bottom: 12px';
	const z = '9998';
	e.innerHTML = `
	  <div id="mysome-access-badge" style="position: fixed; left: 16px; ${top}; ${bottom}; z-index: ${z}; display: flex; cursor: pointer; filter: drop-shadow(1px 0px 4px #2b2b2b61);">
		<a id="mysome-access-badge-link" style="display: flex;" onclick="window.mysome.badge.onClick()">
		  <img src="${logoSvg}" width="60" height="60">
		  <span id="mysome-access-badge-attention" style="position: absolute; top: -1px; right: 5px; color: white; width: 18px; text-align: center; height: 18px;">
			<img src="${attentionSvg}" width="18px" height="18px"></img>
		  </span>
		</a>
	  </div>
	`;

	document.body.appendChild(e);

	const eventHandler = (e: any) => {
		mysome.widgets[id]?.click?.forEach( (x: ((data: any) => void)) => {
			try {
				x(e);
			} catch(e) {
				console.error(e);
			}
		} );
	};
	const anchor = document.getElementById("mysome-access-badge-link");
	anchor?.addEventListener("click", eventHandler);
	const attention = document.getElementById("mysome-access-badge-attention");
	if (attention) {
		attention.style.visibility = !showAttention ? 'hidden' : 'initial';
	}

	mysome.widgets[id] = {
		element: e,
		click: [],
		addClickHandler: (fn: (e: any) => void) => {
			mysome.widgets[id].click.push(fn);
		},
		showAttention: (v: boolean) => {
			if ( attention ) {
				attention.style.visibility = !v ? 'hidden' : 'initial';
			}
		},
		show: () => {
			e.style.display = 'initial';
		},
		hide: () => {
			e.style.display = 'none';
		},
	};
	return mysome.widgets[id];
  };
