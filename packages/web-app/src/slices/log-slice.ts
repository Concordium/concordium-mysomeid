import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { setAll } from "../utils";

export type ILogData = {
  info: string[];
}

const initialState: ILogData = {
  info: [],
};

const logSlice = createSlice({
  name: "log",
  initialState,
  reducers: {
    log: (state, action) => {
      action.payload && state.info.push(action.payload);
    },
  },
});

export default logSlice.reducer;

export const { log } = logSlice.actions;
