import {
  createTheme,
} from '@mui/material/styles';
import { red } from '@mui/material/colors';

import {fontFaces} from './themes/fonts';

export const themeSX = {
  colors: {
    headerBG: '#5099E9',
    panelBG: 'white',
    buttomBGPrimary: '#0615E2',
    buttomBGPrimaryHover: '#020fbd',
  },
  size: {
    s1: '8px',
    s2: '16px',
    s3: '24px',
  },
  text: {
    h1: {
      fontFamily: 'ClearSans',
      fontSize: '32px',
      color: '#292929',
    },
    h2: {
      fontFamily: 'ClearSans',
      fontWeight: 400,
      fontSize: '28px',
      color: '#292929',
    },
    medium: {
      fontFamily: 'ClearSans',
      fontSize: '18px',
      color: '#292929',
    },
  },
};

declare module '@mui/material/styles' {
  interface Theme {
    gradients?: {
      pazazz?: string;
    },
    header: {
      background: string;
    };
  }
  interface ThemeOptions  {
    gradients?: {
      pazazz?: string;
    },
    header?: {
      background?: string;
    };
  }
}

// A custom theme for this app
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  header: {
    background: 'white',
  },
  palette: {
    mode: 'dark',
    background: {
      default: 'white',
    },
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@fontFace": fontFaces
      },
    }
  }
});

export default theme;
