import { useNavigation } from '@react-navigation/native';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type AppStateData = {
  status: AppStateStatus;
  inBackground: Boolean;
};

const AppStateContext = createContext<AppStateData>({} as any as AppStateData);

export const AppStateProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [status, setStatus] = useState<AppStateStatus>(AppState.currentState);
  const [runningInBackground, setRunningBackground] = useState(false);

  const handleAppStateChanged = useCallback((nextStatus: AppStateStatus) => {
    if (status.match(/inactive|background/) && nextStatus === 'active') {
      console.log('App has come to the foreground!');

    } else if ( status === 'active' && nextStatus.match(/inactive|background/) ) {
      console.log('App has come to the background!');
    }
    if ( nextStatus === 'active' ) {
      setRunningBackground(false);

    } else if ( nextStatus === 'inactive' || nextStatus === 'background' ) {
      setRunningBackground(true);

    }
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    if ( !AppState.isAvailable ) {
      return;
    }
    const sub = AppState.addEventListener('change', handleAppStateChanged);
    return () => {
      sub.remove();
    };
  }, [AppState.isAvailable]);

  const value = useMemo<AppStateData>(() => ({
    status,
    inBackground: runningInBackground,
  }), [
    status,
    runningInBackground,
  ]);


  return <AppStateContext.Provider {...{value}}>{children}</AppStateContext.Provider>;
};

export function isInactiveOrBgStatus(s: AppStateStatus) {
  return s === 'inactive' || s === 'background';
}

export function useAppState(): AppStateData {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error(
      "useAppState() can only be used inside of <AppStateProvider />",
    );
  }

  return useMemo<AppStateData>(() => (context), [context]);
}
