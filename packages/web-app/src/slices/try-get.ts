
export async function tryGet(txPromise: Promise<any>, defaultValue: any = null): Promise<any> {
  try {
    return await txPromise;
  } catch(e) {
    console.error(e);
  }
  return defaultValue;
}

