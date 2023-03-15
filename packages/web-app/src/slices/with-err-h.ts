import {
  createAsyncThunk,
  AsyncThunkPayloadCreator,
  AsyncThunkOptions,
  AsyncThunk,
  // AsyncThunkPayloadCreatorReturnValue,
} from "@reduxjs/toolkit";

import { error, } from "./messages-slice";

export function parseVMError(e: any): string {
  let msg = e?.reason ?? e?.message ?? `Unknown error`;
  const d = `Error: VM Exception while processing transaction: reverted with reason string '`;
  if ( `${e?.reason}`.indexOf(d) === 0 ) {
    try {
      msg = e.reason.split(d)[1].slice(0, -1);
    } catch(e) {
      msg = e.reason;
    }
  }
  return msg;
}

// The error handler will display an error message.
export function withErrH<Returned, ThunkArg=void>( method: AsyncThunkPayloadCreator<Returned, ThunkArg, {}> ): AsyncThunkPayloadCreator<Returned, ThunkArg, {}> {
  return (
    (async (arg: any, ctx: any) => {
      try {
        const ret = await method(arg, ctx);
        return ret;
      } catch(e) {
        console.log({...e});
        console.log(e.message);
        console.log(e.reason);
        ctx.dispatch(error(parseVMError(e)));
        throw e;
      }
    }) as any
  );
}

export function createAsyncThunkWithErrH<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, {}>,
  options?: AsyncThunkOptions<ThunkArg, {}>
): AsyncThunk<Returned, ThunkArg, {}> {
  return createAsyncThunk<Returned, ThunkArg>(typePrefix, withErrH(payloadCreator), options);
}
