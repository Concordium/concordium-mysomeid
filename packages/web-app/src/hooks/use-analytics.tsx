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
	AnalyticsEvent<'click-tell-improve'> |
	AnalyticsEvent<'scan-proof-mobile'> |
	AnalyticsEvent<'create-proof-step', {stepNumber: number}> |
	AnalyticsEvent<'view-my-proof-desktop'> |
	AnalyticsEvent<'view-other-proof-desktop'> |
	AnalyticsEvent<'download-proof-again'>;

const analytics = createAnalytics<AvailableAnalyticsEvents>('web-app-');

export const AnalyticsContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
	const value: AnalyticsContextData = useMemo(() => ({
		...analytics
	}), []);

	return <AnalyticsContext.Provider {...{value}}>{children}</AnalyticsContext.Provider>;
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
