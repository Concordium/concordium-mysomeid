
export function isLinkedInProfileUrl (s: string) {
  return s.indexOf('linkedin') >= 0 && s.indexOf('/in/') >= 0;
}
