import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

export type Theme = {
  fontFamily: string;
};

const ThemeContext = createContext<Theme>({} as any as Theme);

export const ThemeProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const value = useMemo<Theme>(() => ({
    fontFamily: 'DIN Alternate',
  }), [
  ]);

  return <ThemeContext.Provider {...{value}}>{children}</ThemeContext.Provider>;
};ThemeContext

export function useTheme(): Theme {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme() can only be used inside of <ThemeProvider />",
    );
  }

  return useMemo<Theme>(() => (context), [context]);
}

