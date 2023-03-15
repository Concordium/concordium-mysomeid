import ClearSansLight from "./ClearSans-Light.ttf";
import ClearSansRegular from "./ClearSans-Regular.ttf";
import ClearSansMedium from "./ClearSans-Medium.ttf";
import ClearSansBold from "./ClearSans-Bold.ttf";

const fontLight = {
  fontFamily: "ClearSans",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 300,
  src: `
		url(${ClearSansLight}) format('truetype')
	`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};


const fontRegular = {
  fontFamily: "ClearSans",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 400,
  src: `
		url(${ClearSansRegular}) format('truetype')
	`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};


const fontMedium = {
  fontFamily: "ClearSans",
  fontStyle: "medium",
  fontDisplay: "swap",
  fontWeight: 500,
  src: `
		url(${ClearSansMedium}) format('truetype')
	`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontSemiBold = {
  fontFamily: "ClearSans",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 600,
  src: `
		url(${ClearSansBold}) format('truetype')
	`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontBold = {
  fontFamily: "ClearSans",
  fontStyle: "bold",
  fontDisplay: "swap",
  fontWeight: 700,
  src: `
		url(${ClearSansBold}) format('truetype')
	`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const kebabize = (str: string) => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
      ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
      : letter;
  }).join('');
};

const fonts = [fontLight, fontRegular, fontMedium, fontSemiBold, fontBold];

export const fontFaces = fonts.reduce((acc, obj) => {
  const raw = Object.entries(obj).reduce(
    (obj, [key, value]) => ({...obj, [kebabize(key)]: `${value}` }),
    {} as Record<string, string | number>,
  );
  const str = Object.entries(raw).reduce(
    (obj, [key, value]) => (`${obj}\t${key}: ${value};\n`),
    '@font-face {\n',
  ) + '}';
  return `${acc}\n\n${str}`;
}, '');

export default fonts;
