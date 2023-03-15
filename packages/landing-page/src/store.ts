import { configureStore } from "@reduxjs/toolkit";

/*import accountReducer from "./slices/AccountSlice";
import appReducer from "./slices/AppSlice";
import bondingReducer from "./slices/BondSlice";
import { bondingReducerV2 } from "./slices/BondSliceV2";
import messagesReducer from "./slices/MessagesSlice";
import pendingTransactionsReducer from "./slices/PendingTxnsSlice";
import daoBuilderReducer from "./slices/DaoBuilderSlice";
import daoBuilderForkReducer from "./slices/DaoBuilderForkSlice";
import daoBuilderLPReducer from "./slices/DaoBuilderForkLPSlice";*/

import configReducer from "./slices/config-slice";

// IBXP: Added
// import { reducer as reduxFormReducer } from 'redux-form';

// import poolDataReducer from "./slices/PoolThunk";
// import zapReducer from "./slices/ZapSlice";
// reducers are named automatically based on the name field in the slice
// exported in slice files by default as nameOfSlice.reducer

const store = configureStore({
  reducer: {
    config: configReducer,
    // form: reduxFormReducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
