import ClearSansRegular from '../assets/fonts/ClearSans-Regular.ttf';
import ClearSansLight from '../assets/fonts/ClearSans-Light.ttf';
import ClearSansMedium from '../assets/fonts/ClearSans-Medium.ttf';
import ClearSansBold from '../assets/fonts/ClearSans-Bold.ttf';

const fontNormal = {
  fontFamily: "Golos-UI",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 400,
  src: `url(${ClearSansRegular}) format('truetype')`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontLight = {
  fontFamily: "Golos-UI",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 300,
  src: `url(${ClearSansLight}) format('truetype')`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontMedium = {
  fontFamily: "Golos-UI",
  fontStyle: "medium",
  fontDisplay: "swap",
  fontWeight: 500,
  src: `url(${ClearSansMedium}) format('truetype')`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontSemiBold = {
  fontFamily: "Golos-UI",
  fontStyle: "normal",
  fontDisplay: "swap",
  fontWeight: 600,
  src: `url(${ClearSansBold}) format('truetype')`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fontBold = {
  fontFamily: "Golos-UI",
  fontStyle: "bold",
  fontDisplay: "swap",
  fontWeight: 700,
  src: `url(${ClearSansBold}) format('truetype')`,
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF",
};

const fonts = [fontNormal, fontLight, fontMedium, fontSemiBold, fontBold];

const kebabize = (str: string) => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
      ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
      : letter;
  }).join('');
};

export const fontFaces = fonts.reduce((acc, obj) => {
    const raw = Object.entries(obj).reduce(
      (obj, [key, value]) => ({...obj, [kebabize(key)]: `${value}` }),
      {} as Record<string, string | number>,
    );
    const str = Object.entries(raw).reduce(
      (obj, [key, value]) => (`${obj}\t${key}: ${key === 'font-family' ? `'${value.toString()}'` : value.toString()};\n`),
      '@font-face {\n',
    ) + '}';
    return `${acc}\n\n${str}`;
  }, '');
// console.log("font faces ", fontFaces);

export default fonts;
