import { configureStore } from "@reduxjs/toolkit";
import { reducer as form } from 'redux-form';
import messages from "./slices/messages-slice";
import app from './slices/app-slice';

const store = configureStore({
  reducer: {
    form,
    app,
    messages,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
