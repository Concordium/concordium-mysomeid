import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { setAll } from "../utils";

export type IAppData = {
  counter: number;
}

const initialState: IAppData = {
  counter: 0,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    incrementCounter: (state, action) => {
      state.counter++;
    },
  },
});

export default appSlice.reducer;

export const { incrementCounter } = appSlice.actions;

