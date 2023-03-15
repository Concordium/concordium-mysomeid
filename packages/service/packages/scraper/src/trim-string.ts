export function trimString(s: string, c: string) {
  const sl = "\\";
  if (c === ']') {
    c = sl + ']';
  }
  else if (c === '^') {
    c = sl + '^';
  }
  else if (c === sl) {
    c = sl + sl;
  }
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}