
import { PaletteColorOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  export interface PaletteOptions {
    /*paletteColors: {
      [key: string]: Partial<Color>
    }[]*/
    type: 'dark' | 'light';
    contrastText: string;
    neutral: {
      main?: string;
      secondary?: string;
    };
  }
  export interface Palette {
    /*paletteColors: {
      [key: string]: Partial<Color>
    }[]*/
    type: 'dark' | 'light';
    contrastText: string; 
    neutral: {
      main?: string;
      secondary?: string;
    };
  }
}

/*

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: React.CSSProperties['color'];
    };
  }

  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral: PaletteOptions['primary'];
  }

  interface PaletteColor {
    darker?: string;
  }
  interface SimplePaletteColorOptions {
    darker?: string;
  }
  interface ThemeOptions {
    status: {
      danger: React.CSSProperties['color'];
    };
  }
}

*/