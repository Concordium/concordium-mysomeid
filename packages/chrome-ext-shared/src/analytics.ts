export type AnalyticsEvent <Type extends string, TArgs extends Record<string, any> = never> = {
	t: Type;
	a?: TArgs;
}

export const createAnalytics = <T extends AnalyticsEvent<string, Record<string, any>>> (prefix: string, defaultArgs: Record<string, string> = {}) => {
    let uniqueId: string | undefined;
    return {
        setUniqueId: (uid: string) => {
            uniqueId = uid;
        },
        track: (data: T): void => {
            const {
                t: actionName,
                a: options,
            } = data;

            const url = new URL("https://concordium.matomo.cloud/matomo.php");
            const vars = Object.entries({...defaultArgs, ...(options ?? {})}).reduce( (acc, [k, v], index) => {
                return {
                    ...acc,
                    [`${index + 1}`]: [k, v],
                };
            }, {});
            url.searchParams.append('_cvar', JSON.stringify(vars));
            url.searchParams.append('action_name', prefix + actionName);
            url.searchParams.append('idsite', '6');
            url.searchParams.append('rec', '1');
            url.searchParams.append('rand', Math.round(Math.random()*99999999999).toString());
            if ( uniqueId !== undefined && uniqueId.length > 0 ) {
                url.searchParams.append('uid', uniqueId);
            }

            fetch(url.toString(),{
                mode: 'no-cors',
            }).then(response => {
                console.log("analytics response " + response.status);
            }).catch(err => {
                console.error(err);
            });
        },
    };
}
