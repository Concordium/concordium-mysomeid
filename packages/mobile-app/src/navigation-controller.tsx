import { useNavigation } from '@react-navigation/native';
import {
  useState,
  useEffect,
  createContext,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import { isInactiveOrBgStatus, useAppState } from './app-state';
import { useIntent } from './intent';

export type NavigationControllerData = {
  setBackDisabled: (b: boolean) => void;
  setOnIgnoreBackCb: (cb: ((e: any) => void) | null) => void;
};

const NavigationControllerContext = createContext<NavigationControllerData>({} as any as NavigationControllerData);

export const NavigationController: React.FC<{children: React.ReactElement }> = ({ children }) => {
  const navigation = useNavigation();
  const {
    getRedirect,
    setRedirectProcessed,
  } = useIntent();
  const isReady = (navigation as any).isReady();
  const route = getRedirect();
  const [to, setTo] = useState<string | null>(null);
  const [routeProcessed, setRouteProcessed] = useState(false);

  const {
    status,
  } = useAppState();

  useEffect(() => {
    if ( isInactiveOrBgStatus(status) ) {
      setRouteProcessed(true);
      setTo(null);
    }
  }, [status]);

  useEffect(() => {
    console.log("Eval setting new route", {route, to});
    if ( isInactiveOrBgStatus(status) ) {
      console.log("Ingored setting new route. We are in background");
      return;
    }
    if ( to === route ) {
      console.log("Ingored setting new route. Route is the same: " + route);
      return;
    }
    console.log("Set new route with id ", {route});
    setTo(route);
    setRouteProcessed(false);
}, [to, route, status]);

  useEffect(() => {
    console.log("Eval redirect ", {routeProcessed, isReady, to});
    if ( routeProcessed ) {
      return;
    }
    if ( !isReady ) {
      return;
    }
    if ( !to ) {
      return;
    }
    try {
      setRedirectProcessed();
      setRouteProcessed(true);
      console.log("Redirect to ", to);
      // console.log("Navigation ", navigation );
      (navigation as any).navigate(to);
    } catch(e) {
      console.error("Error", e);
    }
  }, [routeProcessed, to, isReady]);

  const [backDisabled, setBackDisabled] = useState(false);

  const [onIgnoredBackCb, setOnIgnoreBackCb] = useState<((e: any) => void) | null>(null);

  const handleOnBeforeRemove = useCallback((e: any) => {
    console.log("Navigate back: ", {backDisabled});
    if (!backDisabled) {
      // If we don't have unsaved changes, then we don't need to do anything
      return;
    }
    console.log("Ignored navigating back ", e);
    onIgnoredBackCb?.(e);
    e.preventDefault();
  }, [backDisabled, onIgnoredBackCb]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const sub = (navigation as any).addListener('beforeRemove', handleOnBeforeRemove);
    return () => {
    };
  }, [navigation, isReady]);

  const value = useMemo<NavigationControllerData>(() => ({
    setBackDisabled,
    setOnIgnoreBackCb,
  }), [
    setBackDisabled,
    setOnIgnoreBackCb,
  ]);

  return <NavigationControllerContext.Provider {...{value}}>{children}</NavigationControllerContext.Provider>;
};

export function useNavigationController(): NavigationControllerData {
  const context = useContext(NavigationControllerContext);

  if (!context) {
    throw new Error(
      "useNavigationController() can only be used inside of <NavigationControllerProvider />",
    );
  }

  return useMemo<NavigationControllerData>(() => (context), [context]);
}


