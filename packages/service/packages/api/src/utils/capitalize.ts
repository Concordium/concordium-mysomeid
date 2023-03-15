
export function capitalize (s: string) {
  return s.charAt(0).toUpperCase() + (s.length > 1 ? s.slice(1) : '');
}
