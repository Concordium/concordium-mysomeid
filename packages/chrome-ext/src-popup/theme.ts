import {
  createTheme,
} from '@mui/material/styles';
import { red } from '@mui/material/colors';

import {fontFaces} from './themes/fonts';

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
