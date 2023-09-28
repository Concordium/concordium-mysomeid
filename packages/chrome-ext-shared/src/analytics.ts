import {
    logger
} from './logger';

export type AnalyticsEvent <Type extends string, TOptions extends Record<string, any> = never> = {
	type: Type;
	options?: TOptions;
}

/**
 * Type-safe class-based analytics utility which wraps the Matomo analytics system for usage in the 
 * Chrome extension and dApp.
 */
export class Analytics<T extends AnalyticsEvent<string, Record<string, any>>> {
    private uniqueId?: string;

    constructor(private prefix: string, private defaultArgs: Record<string, string> = {}) {
    }

    /**
     * Set UniqueId can be used to set an id which can be used to correlate a user
     * through different platforms.
     * 
     * Note that the ID mustn't correlate to user data so usually this is stored locally
     * as a UUID on installation or user creation. 
     */
    setUniqueId = (uid: string) => {
        this.uniqueId = uid;
    };

    track = (data: T): void => {
        const {
            type: actionType,
            options,
        } = data;

        const url = new URL("https://concordium.matomo.cloud/matomo.php");
        const vars = Object.entries({ ...this.defaultArgs, ...(options ?? {}) }).reduce((acc, [k, v], index) => {
            return {
                ...acc,
                [`${index + 1}`]: [k, v],
            };
        }, {});
        url.searchParams.append('_cvar', JSON.stringify(vars));
        url.searchParams.append('action_name', this.prefix + actionType);
        url.searchParams.append('idsite', '6');
        url.searchParams.append('rec', '1');
        url.searchParams.append('rand', Math.round(Math.random() * 99999999999).toString());
        if (this.uniqueId !== undefined && this.uniqueId.length > 0) {
            url.searchParams.append('uid', this.uniqueId);
        }

        fetch(url.toString(), {
            mode: 'no-cors',
        }).then(response => {
            logger.verbose("analytics response " + response.status);
        }).catch(err => {
            logger.error(err);
        });
    };
}

/**
 * Method used to instanciate a Analytics object.
 */
export const createAnalytics = <T extends AnalyticsEvent<string, Record<string, any>>> (prefix: string, defaultArgs: Record<string, string> = {}) =>
    new Analytics<T>(prefix, defaultArgs);