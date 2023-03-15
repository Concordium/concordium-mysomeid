
export function __rest(e, t): any {
  const s = {};
  for (const i in e) Object.prototype.hasOwnProperty.call(e, i) && t.indexOf(i) < 0 && (s[i] = e[i]);
  if (null != e && "function" == typeof Object.getOwnPropertySymbols)
    for (let o = 0, i = Object.getOwnPropertySymbols(e); o < i.length; o++) t.indexOf(i[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, i[o]) && (s[i[o]] = e[i[o]]);
  return s
}

export function __rest2<T>(e, t): T {
  const s = {};
  for (const i in e) Object.prototype.hasOwnProperty.call(e, i) && t.indexOf(i) < 0 && (s[i] = e[i]);
  if (null != e && "function" == typeof Object.getOwnPropertySymbols)
    for (let o = 0, i = Object.getOwnPropertySymbols(e); o < i.length; o++) t.indexOf(i[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, i[o]) && (s[i[o]] = e[i[o]]);
  return s as T;
}

export function getSX(sx: any, theme: any): any {
  return typeof sx === 'function' ? sx(theme) : (sx ?? {});
}
