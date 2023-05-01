import React, {
	ReactElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useSearchParams } from "src/hooks/use-search-params";
import { toBuffer } from "@concordium/web-sdk";
import { createSearchParams } from "react-router-dom";
import { isNil } from "src/utils/is-nil";
import { useDispatch } from "react-redux";
import { change } from 'redux-form';
import formName from "./form-props";

type PropName = 'platform' |
	'userId' |
	'name' |
	'profilePicUrl' |
	'backgroundPicUrl' |
	'authorised' |
	'statementInfo' |
	'challenge' |
	'proof' |
	'proofData' |
	'confirmationSeen';

const propNames: PropName[] = [
	'platform',
	'userId',
	'name',
	'profilePicUrl',
	'backgroundPicUrl',
	'authorised',
	'statementInfo',
	'challenge',
	'proof',
	'proofData',
	'confirmationSeen'
];

type FormProps = {
	change: (key: PropName, value: any) => void;
};

type Attribute = {
	attributeTag: string;
	type: string;
}

type UseTemplateStoreArgs = {
	name?: string;
	userId?: string;
	platform?: 'li';
	profilePicUrl?: string;
	backgroundPicUrl?: string;
	authorised?: boolean;
	statementInfo?: Attribute[];
	challenge?: any;
	proof?: any;
	proofData?: any;
	confirmationSeen?: boolean;
};

export type TemplateStoreContextData = {
	updateProps: (props: FormProps, values: UseTemplateStoreArgs) => void;
	getSearchArgs: () => string;
	update: (a: any) => TemplateStoreContextData;
	cache: any;
} | null;

const TemplateStoreContext = React.createContext<TemplateStoreContextData>(null);

export const TemplateStoreContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
	const params = useSearchParams();
	const [cache, setCache] = useState<any>({});
	const [initialised, setInitialised] = useState(false);
	const dispatch = useDispatch();

	useEffect(() => {
		if (initialised) {
			return;
		}

		if (!params || !params.get('template')) {
			setCache({});
			setInitialised(true);
			return;
		}

		let newCache = {};
		try {
			const encodedTemplate = params.get('template');
			if (!encodedTemplate || !encodedTemplate.length) {
				return;
			}
			const base64Template = decodeURIComponent(encodedTemplate);
			const stringTemplate = toBuffer(base64Template, 'base64').toString('utf8');
			newCache = JSON.parse(stringTemplate);
		} catch (e) {
			console.error("Failed to decode template", e);

		}

		for(const entry of Object.entries(newCache ?? {})) {
			const key = entry[0] as PropName;
			const value = entry[1];
			if ( propNames.indexOf(key) >= 0 ) {
				dispatch(change(formName, key, value ));
			}
		}

		setInitialised(true);
		setCache(newCache);
	}, [initialised, params, cache]);

	const updateProps = useCallback((props: FormProps, values: UseTemplateStoreArgs) => {
		if (!props) {
			return;
		}
		for (let entry of Object.entries(values ?? {})) {
			const key = entry[0] as PropName;
			const value = entry[1];
			props.change(key, value);
			if (propNames.indexOf(key)) {
				cache[key] = value;
			}
		}
		setCache(cache);
	}, [cache]);

	const getSearchArgs = useCallback(() => {
		const props = propNames.reduce((acc, key) => {
			return {
				...acc,
				...(!isNil(cache.name) ? { [key]: cache[key] } : {})
			};
		}, {});
		const str = JSON.stringify(props);
		const template = toBuffer(str, 'utf8').toString('base64');
		const ret = `?${createSearchParams({
			template
		})}`;
		if (ret.length > 2000) {
			throw new Error('Url length too long. more than 2000 characters');
		}
		return ret;
	}, [cache]);

	const update = useCallback((values: any): TemplateStoreContextData => {
		for (let entry of Object.entries(values)) {
			const key = entry[0] as PropName;
			const value = entry[1] as string;
			if (propNames.indexOf(key)) {
				cache[key] = value;
			}
		}
		setCache(cache);
		return values;
	}, [cache]);

	const value: TemplateStoreContextData = useMemo(() => ({
		updateProps,
		getSearchArgs,
		update,
		cache,
	}), [
		updateProps,
		getSearchArgs,
		update,
		cache,
	]);

	return <TemplateStoreContext.Provider {...{ value }}>{initialised ? children : null}</TemplateStoreContext.Provider>;
};

export const useTemplateStore = (formProps?: FormProps, savePropList?: PropName[]) => {
	const ctx = useContext(TemplateStoreContext);
	if (!ctx) {
		throw new Error(
			"useTemplateStore() can only be used inside of <TemplateStoreContextProvider />",
		);
	}

	const values = Object.entries(((formProps ?? {}) as any)).reduce((acc, it) => {
		const key = it[0] as PropName;
		const value = it[1];
		return {
			...acc,
			...(savePropList.indexOf(key) >= 0 ? { [key]: value } : {}),
		};
	}, {});

	return useMemo<any>(() => {
		const input = {
			...ctx,
			...ctx.cache,
			...(values ?? {}),
		} as any;

		// Transform the default profile picture and background picture url into a default image
		// this data comes from when scraping linkedin user profile and background.
		// default: set when the profile pic url is the default
		// data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7 set when the profile picture url is the default
		// null/undefined: should be converted to the default url in case nothing has been been defined.
		input.profilePicUrl = ['default', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', null, undefined].indexOf(input.profilePicUrl ?? null) === -1 ? input.profilePicUrl : 'https://static.licdn.com/sc/h/13m4dq9c31s1sl7p7h82gh1vh';
		input.backgroundPicUrl = ['default', null, undefined].indexOf(input.backgroundPicUrl ?? null) === -1 ? input.backgroundPicUrl : 'https://static.licdn.com/sc/h/lortj0v1h4bx9wlwbdx6zs3f';

		const output = ctx.update(input);
		return output;
	}, [ctx, values]);
};
