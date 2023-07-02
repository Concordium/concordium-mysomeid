
/**
 * This logger component will be used to control logging by the extension
 */
export const logger = {
	info: (s: any, ...rest: any[]) => {
/// #if LOG_INFO
		console.log('MySoMe:', ...[s, ...rest]);
/// #endif
	},
	error: (s: any, ...rest: any[]) => {
		console.error('MySoMe:', ...[s, ...rest]);
	},
	warn: (s: any, ...rest: any[]) => {
/// #if LOG_WARN
		console.warn('MySoMe:', ...[s, ...rest]);
/// #endif
	},
	verbose: (s: any, ...rest: any[]) => {
/// #if LOG_VERBOSE
		console.log('MySoMe:', ...[s, ...rest]);
/// #endif
	},
};
