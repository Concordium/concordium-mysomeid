import {logger} from '@mysomeid/chrome-ext-shared';

export const tracking: Record<string, any> = {
};

const trackingSubscribers: Record<string, ((val: any) => void)[]> = {};

tracking.on = (name: string, fn: ((val: any) => void)) => {
	trackingSubscribers[name] = trackingSubscribers[name] ?? [];
	trackingSubscribers[name].push(fn);
};

tracking.off = (name: string, fn: (val: any) => void) => {
	trackingSubscribers[name] = trackingSubscribers[name] ?? [];
	const index = trackingSubscribers[name].findIndex( x => x === fn );
	if ( index >= 0 ) {
		trackingSubscribers[name].slice(index, 1);
	}
};

tracking.fire = (name: string, value: any) => {
	(trackingSubscribers[name] ?? []).forEach(s => {
		try {
			s && s(value);
		} catch(e) {
			logger.error(e);
		}
	});
};

type TrackerArgs<T> = {
	name: string;
	query?: string | (() => T);
	initialValue?: T | null; ///  = null;
	mode?: 'normal' | 'observed';
	throttle?: number;
	cmp?: (oldVal: T | null, newVal: T | null) => boolean;
}

type TrackerUpdateReturn <T> = {
	value: T;
	dirty: boolean;
	before?: T | null;
};

type Tracker <T> = {
	update: (args?: TrackerUpdateArgs<T>) => TrackerUpdateReturn<T>,
	get: () => T | null,
	start: () => void,
	stop: () => void,
	reset: () => void,
	changeEventName: string;
};

type TrackerUpdateArgs <T> = {
	prerequisites?: boolean[],
	on?: (value: T) => void;
	query?: () => T;
	throttle?: number;
	resetThrottle?: boolean;
	cmp?: (oldVal: T | null, newVal: T | null) => boolean;
};

export function createTracker<T>(args: TrackerArgs<T>): Tracker<T> {
	const {
		name,
		query,
		initialValue = null,
		mode = 'normal',
		throttle = 0,
		cmp: defaultCompareFn,
	} = args;
	if (['off', 'on', 'fire'].indexOf(name) >= 0 ) {
		throw new Error('Cannot use field name.');
	}
	const trackerState = {
		value: initialValue as T | null,
		lastChanged: 0 as number,
		lastUpdate: 0 as number,
	};
	tracking[name] = trackerState.value;
	const update = (args?: TrackerUpdateArgs<T>): TrackerUpdateReturn<T> => {
		const {
			on: fnSet,
			query: fnOverrideQuery,
			cmp: fnCompareOverride,
			prerequisites,
			throttle: throttleOverride = 0,
			resetThrottle = false,
		} = args ?? {};

		const _throttle = throttle ?? throttleOverride
		let throttleWait = false;
		if ( _throttle > 0 ) {
			const ts = new Date().getTime();
			const delta = Math.max(trackerState.lastUpdate, ts) - Math.min(trackerState.lastUpdate, ts);
			throttleWait = delta < _throttle && !resetThrottle;
		}

		let value = null as any;
		const prerequisitesMet = !throttleWait && (!prerequisites || prerequisites.reduce((arr, it) => arr && it, true));
		if ( prerequisitesMet ) {
			trackerState.lastUpdate = new Date().getTime();
			const what = fnOverrideQuery ?? query;
			if ( typeof what === 'function' ) {
				value = what();
			} else if ( typeof what === 'string' ) {
				value = !!document.querySelector(what);
			} else {
				throw new Error('Invalid type ')
			}	
			const compare = defaultCompareFn ?? fnCompareOverride ?? ((oldVal: T | null, newVal: T | null): boolean => {
				return oldVal !== newVal;
			});
			if ( prerequisitesMet && compare(trackerState.value, value) || trackerState.lastChanged === 0 ) {
				let ignore = false;
				if ( mode === 'observed' && trackerState.lastChanged !== 0 ) {
					ignore = true;
				}
				if ( !ignore ) {
					const valueBefore = trackerState.value;
					trackerState.value = value;
					trackerState.lastChanged = new Date().getTime();
					logger.verbose(`${name} ${mode === 'normal' ? 'changed' : 'observed'} => `, value);
					fnSet && fnSet(value);
					tracking[name] = value;
					tracking.fire(`${name}`, value);
					tracking.fire(`${name}${(mode === 'normal' ? 'Changed' : 'Observed')}`, value);
					return {
						value,
						dirty: true,
						before: valueBefore,
					};
				}
			}
		}

		return {
			value,
			dirty: false
		};
	};
	let timer: any = null;
	const start = () => {
		timer = setInterval( update, 1000 );
	};
	const stop = () => {
		clearInterval(timer);
	};
	const reset = () => {
		trackerState.lastChanged = 0;
		trackerState.value = initialValue ?? null;
	};
	return {
		update,
		get: () => trackerState.value,
		start,
		stop,
		reset,
		changeEventName: name + 'Changed',
	};
};
