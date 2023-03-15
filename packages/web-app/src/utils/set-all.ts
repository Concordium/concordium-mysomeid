export function setAll(state: any, properties: any) {
  Object.keys(properties ?? {}).forEach(key => {
    state[key] = properties[key];
  });
}
