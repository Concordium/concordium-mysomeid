import {
	logger,
	// verbose,
} from './utils';

export type ShieldWidget = {
	elements: Record<string, HTMLElement>;
	setInitialState: () => void;
	setOwnProfileNotVerified: () => void;
	setOtherProfileNotVerified: () => void;
	setVerified: (proofUrl: string, ownProfile: boolean) => void;
	setSuspeciousProfile: (_url: string) => void;
	setNoConnection: () => void;
	hide: () => void;
	show: () => void;
	isLoading: () => boolean;
};

export const createShieldWidget = (nameElement: HTMLElement, {onClicked}: {onClicked: (state: string, proofUrl: string) => void}): ShieldWidget => {
	const resolveRootChildren = (): Record<string, HTMLElement> => {
		const container = document.getElementById('mysome-shield-container');
		const shield = document.getElementById('mysome-shield-widget');
		const dots = document.getElementById('mysome-shield-dots');
		const check = document.getElementById('mysome-shield-check');
		const tooltip = document.getElementById('mysome-shield-tooltip');
		const exclaim = document.getElementById('mysome-shield-exclaim');
		/*console.log({
			container,
			shield,
			dots,
			check,
			tooltip,
		});*/
		if ( !container || !dots || !shield || !check || !tooltip || !exclaim ) {
			throw new Error('MySoMeID: Failed to install MySoMeID extension to profile page');
		}
		return {
			container,
			shield,
			dots,
			check,
			tooltip,
			exclaim,
		};
	};

	const shieldColorLoading = '#b9b9b9';
	const shieldColorVerified = '#4da3f8';
	// const shieldColorNotVerified = '#f8b24d';
	const shieldColorYellow = 'rgb(171 127 0)';
	const shieldColorRed = '#D5645D';
	const dotsLeftOffset = 6;
	const dotsWH = 4;
	const dotsRadius = 2;
	const dotsColor = '#000000';
	const dotsAnimColor = 'rgba(0, 0, 0, 0.2)';
	const tooltipTextVerified = 'MYSOMEID:</br></br>Profile Verified';
	const tooltipTextOwnProfileVerified = 'MYSOMEID:</br></br>Your profile is secure'
	const tooltipTextNotVerified = 'MYSOMEID:</br></br>Profile NOT verified'
	const tooltipTextOwnProfileNotVerified = 'MYSOMEID:</br></br>You are not secured</br></br>Click to get started';
	const tooltipTextOtherProfileNotVerified = 'MYSOMEID:</br></br>This profile is not verified.</br>';
	const tooltipTextNoConnection = 'MYSOMEID:</br></br>No Connection</br>';
	let state: 'none' | 'no-connection' | 'verified' | 'own-profile-not-verified' | 'other-profile-not-verified' | 'suspecious';
	let created = false;
	let proofUrl = '';

	if ( !document.getElementById('mysome-shield-root') ) {
		//const shieldSvg = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTlweCIgaGVpZ2h0PSIyM3B4IiB2aWV3Qm94PSIwIDAgMTkgMjMiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjIgKDc4MTgxKSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT52ZXJpZmllZC11c2VyLXNoaWVsZC1jaGVjayBjb3B5PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9InZlcmlmaWVkLXVzZXItc2hpZWxkLWNoZWNrLWNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLjAwMDAwMCwgLTEuMDAwMDAwKSI+CiAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJQYXRoIiBwb2ludHM9IjAgMCAyNSAwIDI1IDI1IDAgMjUiPjwvcG9seWdvbj4KICAgICAgICAgICAgPHBhdGggZD0iTTEyLjUsMS4wNDE2NjY2NyBMMy4xMjUsNS4yMDgzMzMzMyBMMy4xMjUsMTEuNDU4MzMzMyBDMy4xMjUsMTcuMjM5NTgzMyA3LjEyNSwyMi42NDU4MzMzIDEyLjUsMjMuOTU4MzMzMyBDMTcuODc1LDIyLjY0NTgzMzMgMjEuODc1LDE3LjIzOTU4MzMgMjEuODc1LDExLjQ1ODMzMzMgTDIxLjg3NSw1LjIwODMzMzMzIEwxMi41LDEuMDQxNjY2NjcgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==`;
		const checkmarkSvg = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTNweCIgaGVpZ2h0PSIxMXB4IiB2aWV3Qm94PSIwIDAgMTMgMTEiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjIgKDc4MTgxKSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT52ZXJpZmllZC11c2VyLXNoaWVsZC1jaGVjayBjb3B5IDI8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0idmVyaWZpZWQtdXNlci1zaGllbGQtY2hlY2stY29weS0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNi4wMDAwMDAsIC03LjAwMDAwMCkiPgogICAgICAgICAgICA8cG9seWdvbiBpZD0iUGF0aCIgcG9pbnRzPSIwIDAgMjUgMCAyNSAyNSAwIDI1Ij48L3BvbHlnb24+CiAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJTaGFwZSIgZmlsbD0iIzJEMkQyRCIgZmlsbC1ydWxlPSJub256ZXJvIiBwb2ludHM9IjEwLjQxNjY2NjcgMTcuNzA4MzMzMyA2LjI1IDEzLjU0MTY2NjcgNy43MTg3NSAxMi4wNzI5MTY3IDEwLjQxNjY2NjcgMTQuNzYwNDE2NyAxNy4yODEyNSA3Ljg5NTgzMzMzIDE4Ljc1IDkuMzc1Ij48L3BvbHlnb24+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=`;
		const exclaimationSvg = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iM3B4IiBoZWlnaHQ9IjE0cHgiIHZpZXdCb3g9IjAgMCAzIDE0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA1NS4yICg3ODE4MSkgLSBodHRwczovL3NrZXRjaGFwcC5jb20gLS0+CiAgICA8dGl0bGU+ZXhjbGFpbWF0aW9uPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImV4Y2xhaW1hdGlvbiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExLjAwMDAwMCwgLTYuMDAwMDAwKSI+CiAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJQYXRoIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwIiBwb2ludHM9IjAgMCAyNSAwIDI1IDI1IDAgMjUiPjwvcG9seWdvbj4KICAgICAgICAgICAgPHBvbHlnb24gaWQ9IlNoYXBlIiBmaWxsPSIjRDhEOEQ4IiBmaWxsLXJ1bGU9Im5vbnplcm8iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyLjQ5MjYyNiwgMTAuOTMzMDc3KSByb3RhdGUoLTQ1LjAwMDAwMCkgdHJhbnNsYXRlKC0xMi40OTI2MjYsIC0xMC45MzMwNzcpICIgcG9pbnRzPSI5LjUxODQ3MzQgMTUuMTkyMTE0MiA4LjE3ODc2MzE0IDEzLjg1MjQwMzkgMTQuNzI5NTY2NSA2LjY3NDA0MDU4IDE2LjgwNjQ4OSA4Ljc1MDk2MzA5Ij48L3BvbHlnb24+CiAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwiIGZpbGw9IiNEOEQ4RDgiIGN4PSIxMi41IiBjeT0iMTguNSIgcj0iMS41Ij48L2NpcmNsZT4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==';
		// const eyeSvg = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjNweCIgaGVpZ2h0PSIxNHB4IiB2aWV3Qm94PSIwIDAgMjMgMTQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjIgKDc4MTgxKSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT5leWUtMTIxMDk8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iZXllLTEyMTA5IiBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iPgogICAgICAgICAgICA8cGF0aCBkPSJNMTEuMzc0OTA1MiwxNCBDNy42MTYzODM3NSwxNCAzLjg0ODUwOTYsMTEuODA0NjU5NyAwLjE3NTE3MzU0LDcuNDc0OTA1OCBDLTAuMDU4MzkxMTgwMSw3LjE5OTQ5NzU5IC0wLjA1ODM5MTE4MDEsNi44MDAyNTQ3NSAwLjE3NTE3MzU0LDYuNTI0ODQ2NTMgQzMuODQ4NTA5NiwyLjE5NTM0MDI4IDcuNjE2MzgzNzUsMCAxMS4zNzQ5MDUyLDAgQzE1LjEzMzE3MzksMCAxOC45MDEzMDA4LDIuMTk1MzQwMjggMjIuNTc0NjM2OSw2LjUyNDg0NjUzIEMyMi44MDg0NTQ0LDYuODAwMjU0NzUgMjIuODA4NDU0NCw3LjE5OTQ5NzU5IDIyLjU3NDYzNjksNy40NzQ5MDU4IEMxOC45MDEzMDA4LDExLjgwNDQxMjEgMTUuMTMzMTczOSwxNCAxMS4zNzQ5MDUyLDE0IFogTTEuNzUyNzQ2NSw2Ljk5OTg3NjE3IEM0Ljk4NzI2NCwxMC42NTk0MzcxIDguMjIyMjg3MDQsMTIuNTEzOTg0NSAxMS4zNzQ5MDUyLDEyLjUxMzk4NDUgQzE0LjUyNzc3NjIsMTIuNTEzOTg0NSAxNy43NjI1NDY0LDEwLjY1OTY4NDggMjAuOTk3MDYzOSw2Ljk5OTg3NjE3IEMxNy43NjI1NDY0LDMuMzQwMzE1MjUgMTQuNTI3Nzc2MiwxLjQ4NjAxNTUzIDExLjM3NDkwNTIsMS40ODYwMTU1MyBDOC4yMjIyODcwNCwxLjQ4NjAxNTUzIDQuOTg3MjY0LDMuMzQwMzE1MjUgMS43NTI3NDY1LDYuOTk5ODc2MTcgWiIgaWQ9IlNoYXBlIj48L3BhdGg+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMS4zNzUsMTEuMzc1IEM4Ljk2MjU3MzUzLDExLjM3NSA3LDkuNDEyNDI2NDcgNyw3IEM3LDQuNTg3NTczNTMgOC45NjI1NzM1MywyLjYyNSAxMS4zNzUsMi42MjUgQzEzLjc4NzQyNjUsMi42MjUgMTUuNzUsNC41ODc1NzM1MyAxNS43NSw3IEMxNS43NSw5LjQxMjQyNjQ3IDEzLjc4NzQyNjUsMTEuMzc1IDExLjM3NSwxMS4zNzUgWiBNMTEuMzc1LDQuMTY5MTE3NjUgQzkuODE0MTU0NDEsNC4xNjkxMTc2NSA4LjU0NDExNzY1LDUuNDM5MTU0NDEgOC41NDQxMTc2NSw3IEM4LjU0NDExNzY1LDguNTYwODQ1NTkgOS44MTQxNTQ0MSw5LjgzMDg4MjM1IDExLjM3NSw5LjgzMDg4MjM1IEMxMi45MzU4NDU2LDkuODMwODgyMzUgMTQuMjA1ODgyNCw4LjU2MDg0NTU5IDE0LjIwNTg4MjQsNyBDMTQuMjA1ODgyNCw1LjQzOTE1NDQxIDEyLjkzNTg0NTYsNC4xNjkxMTc2NSAxMS4zNzUsNC4xNjkxMTc2NSBaIiBpZD0iU2hhcGUiPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==`;
		const verifiedElem = document.createElement('div');
		verifiedElem.style.marginLeft = '10px';
		verifiedElem.style.display = 'inline'; 
		verifiedElem.id = 'mysome-shield-root';
		verifiedElem.innerHTML = `
			<style>
				#mysome-shield-dots {
					position: relative;
					width: ${dotsWH}px;
					height: ${dotsWH}px;
					border-radius: ${dotsRadius}px;
					background-color: ${dotsColor};
					color: ${dotsColor};
					animation: mysome-shield-dots 1s infinite linear alternate;
					animation-delay: 0.5s;
				}
	
				#mysome-shield-dots::before, #mysome-shield-dots::after {
					content: "";
					display: inline-block;
					position: absolute;
					top: 0;
				}
	
				#mysome-shield-dots::before {
					left: -${dotsLeftOffset}px;
					width: ${dotsWH}px;
					height: ${dotsWH}px;
					border-radius: ${dotsRadius}px;
					background-color: ${dotsColor};
					color: ${dotsColor};
					animation: mysome-shield-dots 1s infinite alternate;
					animation-delay: 0s;
				}
	
				#mysome-shield-dots::after {
					left: ${dotsLeftOffset}px;
					width: ${dotsWH}px;
					height: ${dotsWH}px;
					border-radius: ${dotsRadius}px;
					background-color: ${dotsColor};
					color: ${dotsColor};
					animation: mysome-shield-dots 1s infinite alternate;
					animation-delay: 1s;
				}

				@keyframes mysome-shield-dots {
					0% {
						background-color: ${dotsColor};
					}
					50%, 100% {
						background-color: ${dotsAnimColor};
					}
				}

				#mysome-shield-container #mysome-shield-tooltip {
					visibility: hidden;
					width: 200px;
					background-color: black;
					color: #fff;
					padding: 5px;
					border-radius: 4px;
					bottom: 111%;
					margin-left: -87px;
					position: absolute;
					z-index: 9999;
					font-size: 14px;
					min-height: 60px;
					text-align: center;
					display: flex;
					align-items: center;
					cursor: pointer;
				}
	
				#mysome-shield-container #mysome-shield-tooltip::after {
					content: "";
					position: absolute;
					top: 100%;
					left: 50%;
					margin-left: -9px;
					border-width: 8px;			
					border-style: solid;
					border-color: #000 transparent transparent transparent;
				}
	
				#mysome-shield-container:hover #mysome-shield-tooltip {
					visibility: visible;
				}
	
			</style>
	
			<div id="mysome-shield-container" style="height: 28px;width: 1px; display: inline-block; ">
				<div id="mysome-shield-widget" style="width: 25px;height: 28px;margin-top: 8px;display: block;-webkit-mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTlweCIgaGVpZ2h0PSIyM3B4IiB2aWV3Qm94PSIwIDAgMTkgMjMiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDU1LjIgKDc4MTgxKSAtIGh0dHBzOi8vc2tldGNoYXBwLmNvbSAtLT4KICAgIDx0aXRsZT52ZXJpZmllZC11c2VyLXNoaWVsZC1jaGVjayBjb3B5PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9InZlcmlmaWVkLXVzZXItc2hpZWxkLWNoZWNrLWNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLjAwMDAwMCwgLTEuMDAwMDAwKSI+CiAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJQYXRoIiBwb2ludHM9IjAgMCAyNSAwIDI1IDI1IDAgMjUiPjwvcG9seWdvbj4KICAgICAgICAgICAgPHBhdGggZD0iTTEyLjUsMS4wNDE2NjY2NyBMMy4xMjUsNS4yMDgzMzMzMyBMMy4xMjUsMTEuNDU4MzMzMyBDMy4xMjUsMTcuMjM5NTgzMyA3LjEyNSwyMi42NDU4MzMzIDEyLjUsMjMuOTU4MzMzMyBDMTcuODc1LDIyLjY0NTgzMzMgMjEuODc1LDE3LjIzOTU4MzMgMjEuODc1LDExLjQ1ODMzMzMgTDIxLjg3NSw1LjIwODMzMzMzIEwxMi41LDEuMDQxNjY2NjcgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==);-webkit-mask-position: center;-webkit-mask-size: 23px;background: ${shieldColorLoading}; -webkit-mask-repeat: no-repeat;" alt="" src="">
					<div id="mysome-shield-dots" style="top: 11px; left: 10px;" ></div>
					<div id="mysome-shield-check" style="background: url(${checkmarkSvg});width: 26px;height: 27px;background-repeat: no-repeat;background-position: center;"></div>
					<div id="mysome-shield-exclaim" style="background: url(${exclaimationSvg});width: 25px;height: 27px;background-repeat: no-repeat;background-position: center;"></div>
				</div>
				<div id="mysome-shield-tooltip">
					<div style="display: flex; width: 100%; place-content: center;">
						<span id="mysome-shield-tooltip-text">${tooltipTextVerified}</span>
					</div>
				</div>
				<div id="mysome-shield-dummy" style="display: none"></div>
			</div>
		`;
		nameElement.appendChild(verifiedElem);

		created = true;
	} else {
		logger.info('Shield: Root element already existed');
	}

	const root = document.getElementById('mysome-shield-root');
	if ( !root ) {
		throw new Error('Shield: No widget found.');
	}
	nameElement.appendChild(root);

	const {
		container,
		shield,
		dots,
		check,
		exclaim,
		tooltip,
	} = resolveRootChildren();

	if ( created ) {
		const handleClick = () => {
			onClicked(state, proofUrl);
		};
		tooltip.addEventListener('click', handleClick);
		shield.addEventListener('click', handleClick);
	}

	return {
		elements: {
			container,
			shield,
			dots,
			check,
			exclaim,
			tooltip,
		},
		setInitialState: () => {
			state = 'none';
			check.style.display = 'none';
			dots.style.display = 'block';
			shield.style.display = 'block';
			shield.style.backgroundColor = shieldColorLoading;
			tooltip.style.display = 'none';
			shield.style.cursor = 'pointer';
			exclaim.style.display = 'none';
			proofUrl = '';
		},
		setNoConnection: () => {
			state = 'no-connection';
			shield.style.backgroundColor = shieldColorYellow;
			dots.style.display = 'none';
			check.style.display = 'none';
			shield.style.cursor = 'pointer';
			tooltip.style.display = 'flex';
			exclaim.style.display = 'block';
			const el = document.getElementById('mysome-shield-tooltip-text');
			if ( el ) el.innerHTML = tooltipTextNoConnection;
		},
		setOwnProfileNotVerified: () => {
			state = 'own-profile-not-verified';
			shield.style.backgroundColor = shieldColorYellow;
			dots.style.display = 'none';
			check.style.display = 'none';
			shield.style.cursor = 'pointer';
			tooltip.style.display = 'flex';
			exclaim.style.display = 'block';
			const el = document.getElementById('mysome-shield-tooltip-text');
			if ( el ) el.innerHTML = tooltipTextOwnProfileNotVerified;
		},
		setOtherProfileNotVerified: () => {
			state = 'other-profile-not-verified';
			shield.style.backgroundColor = shieldColorYellow;
			dots.style.display = 'none';
			check.style.display = 'none';
			shield.style.cursor = 'pointer';
			tooltip.style.display = 'flex';
			exclaim.style.display = 'block';
			const el = document.getElementById('mysome-shield-tooltip-text');
			if ( el ) el.innerHTML = tooltipTextOtherProfileNotVerified;
		},
		setVerified: (_proofUrl: string, ownProfile: boolean) => {
			state = 'verified';
			proofUrl = _proofUrl;
			shield.style.backgroundColor = shieldColorVerified;
			dots.style.display = 'none';
			check.style.display = 'block';
			tooltip.style.display = 'flex';
			shield.style.cursor = 'pointer';
			exclaim.style.display = 'none';
			const el = document.getElementById('mysome-shield-tooltip-text');
			if ( el ) el.innerHTML = ownProfile ? tooltipTextOwnProfileVerified : tooltipTextVerified;
		},
		setSuspeciousProfile: (_proofUrl: string) => {
			state = 'suspecious';
			proofUrl = _proofUrl;
			shield.style.backgroundColor = shieldColorRed;
			dots.style.display = 'none';
			check.style.display = 'none';
			exclaim.style.display = 'block';
			tooltip.style.display = 'flex';
			shield.style.cursor = 'pointer';

			const el = document.getElementById('mysome-shield-tooltip-text');
			if ( el ) el.innerHTML = tooltipTextNotVerified;
		},
		hide: () => {
			container.style.display = 'none';
		},
		show: () => {
			container.style.display = 'inline-block';
		},
		isLoading: () => {
			return state === 'none';
		},
	}
};

