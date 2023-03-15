import { setAll } from '../utils';
import { error as errorEvent } from 'src/slices/messages-slice';
import store from 'src/store';

export const addThunk = (builder, thunk, running, done, setRunning, setDone) => {
  builder
  .addCase(thunk.pending, state => {
    if ( running && running(state) ) {
      throw new Error('Already running');
    }
    if ( done && done(state) ) {
      throw new Error('Already done');
    }
    setRunning && setRunning(state, true);
  })
  .addCase(thunk.fulfilled, (state, action) => {
    setAll(state, action.payload);
    setRunning && setRunning(state, false);
    setDone && setDone(state, true);
  })
  .addCase(thunk.rejected, (state, { error }) => {
    console.warn(error, error.name, error.message, error.stack);
    window.setTimeout(() => {
      store.dispatch(errorEvent(error.message));
    });
    if ( error.message === 'Already running' || error.message === 'Already done' ) {
      return;
    }
    setRunning && setRunning(state, false);
  });
};
