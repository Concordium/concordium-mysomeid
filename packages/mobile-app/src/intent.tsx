import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import * as Linking from 'expo-linking';
import { parseValidLinkedInUrl } from './utils';
import { isInactiveOrBgStatus, useAppState } from './app-state';
import { routes } from './routes';

export type IntentData = {
  getCurrentUrlToValidate: () => string | null;
  setCurrentUrlToValidateProcessed: () => void;
  getRedirect: () => string | null;
  setRedirectProcessed: () => void;
};

const IntentContext = createContext<IntentData>({} as any as IntentData);

const MessagesModule = NativeModules.MessagesModule;

export const IntentProvider: React.FC<{children: React.ReactElement }> = ({ children }) => {
  const url = Linking.useURL();
  const [validateUrl, setValidateUrl] = useState<any>(null);
  const [redirect,] = useState<string | null>(routes.validateOther);
  const [redirectProcessed, setRedirectProcessed] = useState(false);
  const [urlToValidateProcessed, setUrlToValidateProcessed] = useState(false);

  const {
    status,
  } = useAppState();

  useEffect(() => {
    if ( isInactiveOrBgStatus(status) ) {
      console.log("App is put in background - resetting intent");
      setValidateUrl(null);
      setRedirectProcessed(true);
      setUrlToValidateProcessed(true);
    }
  }, [status]);

  useEffect(() => {
    console.log("App initialised");
    setValidateUrl(null);
    setUrlToValidateProcessed(true);
    setRedirectProcessed(true);
  }, []);

  useEffect(() => {
    if ( !url ) {
      return;
    }
    if ( isInactiveOrBgStatus(status) ) {
      return;
    }
    const newValdateUrl = parseValidLinkedInUrl(url) ?? validateUrl;
    if( newValdateUrl === validateUrl && !urlToValidateProcessed && !redirectProcessed ) {
      return;
    }
    console.log("App started with url to validate", newValdateUrl, {
      oldUrl: validateUrl,
      newUrl: newValdateUrl,
      redirectProcessed: false,
      urlToValidateProcessed: false,
    });
    setRedirectProcessed(false);
    setUrlToValidateProcessed(false);
    setValidateUrl(newValdateUrl);
  }, [validateUrl, url, status]);

  // Only relevant on Android
  useEffect(() => {
    if ( !MessagesModule ) {
      return;
    }
    const listener = DeviceEventEmitter.addListener('intent', (e) => {
      const {
        action,
        extra_text,
        type,
      } = e;
      if ( action === 'android.intent.action.SEND' && (type === 'text/plain' || type === 'text/x-uri' || type === 'text/uri-list') ) {
        const isValid = !!parseValidLinkedInUrl(extra_text);
        const newUrl = isValid ? parseValidLinkedInUrl(extra_text) : validateUrl;
        console.log("App intent changed with url ", newUrl);
        setRedirectProcessed(false);
        setUrlToValidateProcessed(false);
        setValidateUrl(newUrl);
      }
    });
    MessagesModule.setReady();
    return () => {
      MessagesModule.setNotReady();
      listener?.remove?.();      
    };
  }, [validateUrl, MessagesModule]);

  const getCurrentUrlToValidate = useCallback(() => {
    console.log("getCurrentUrlToValidate" , {
      validateUrl, urlToValidateProcessed
    });
    if ( urlToValidateProcessed ) {
      return null;
    }
    return validateUrl;
  }, [validateUrl, urlToValidateProcessed]);

  const setCurrentUrlToValidateProcessed = useCallback(() => {
    console.log("setCurrentUrlToValidateProcessed");
    setUrlToValidateProcessed(true);
  }, []);

  const setRedirectProcessedFn = useCallback(() => {
    setRedirectProcessed(true);
  }, []);

  const getRedirect = useCallback(() => {
    console.log("get Redirect", {validateUrl, redirectProcessed});
    if ( isInactiveOrBgStatus(status) ) {
      return null;
    }
    if ( !validateUrl ) {
      return null;
    }
    if ( redirectProcessed ) {
      return null;
    }
    return redirect;
  }, [validateUrl, status]);

  const value = useMemo<IntentData>(() => ({
    getCurrentUrlToValidate,
    setCurrentUrlToValidateProcessed,
    setRedirectProcessed: setRedirectProcessedFn,
    getRedirect,
  }), [
    getCurrentUrlToValidate,
    setCurrentUrlToValidateProcessed,
    setRedirectProcessedFn,
    getRedirect,
  ]);

  return <IntentContext.Provider {...{value}}>{children}</IntentContext.Provider>;
};

export function useIntent(): IntentData {
  const context = useContext(IntentContext);

  if (!context) {
    throw new Error(
      "useIntent() can only be used inside of <IntentProvider />",
    );
  }

  return useMemo<IntentData>(() => (context), [context]);
}
