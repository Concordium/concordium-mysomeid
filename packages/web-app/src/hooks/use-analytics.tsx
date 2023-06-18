import {
	createAnalytics,
	AnalyticsEvent,
} from '@mysomeid/chrome-ext-shared';

import React, {
	ReactElement,
	useCallback,
	useContext,
	useMemo,
} from "react";

export type AnalyticsContextData = {
	track: (e: AvailableAnalyticsEvents) => void;
	setUniqueId: (uid: string) => void;
} | null;

const AnalyticsContext = React.createContext<AnalyticsContextData>(null);

type AvailableAnalyticsEvents =
	AnalyticsEvent<'uninstalled'> |
	AnalyticsEvent<'click-tell-improve'>

const analytics = createAnalytics<AvailableAnalyticsEvents>('web-app-');

export const AnalyticsContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {

	const track = (e: AvailableAnalyticsEvents) => {
		analytics.track(e);
	}

	const setUniqueId = (uid: string) => {
		analytics.setUniqueId(uid);
	};

	const value: AnalyticsContextData = useMemo(() => ({
		track,
		setUniqueId,
	}), [
		track,
		setUniqueId,
	]);

	return <AnalyticsContext.Provider {...{ value }}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = () => {
	const ctx = useContext(AnalyticsContext);
	if (!ctx) {
		throw new Error(
			"useAnalytics() can only be used inside of <AnalyticsContextProvider />",
		);
	}
	return useMemo<AnalyticsContextData>(() => ctx, [ctx]);
};
