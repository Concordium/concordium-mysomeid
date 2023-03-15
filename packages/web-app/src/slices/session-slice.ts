import {io} from 'socket.io-client';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from 'src/store';
import { setAll } from '../utils';

type ISessionData = {
  started: boolean;
  starting: boolean;
  connected: boolean;
  connectingToChart: boolean;
  connectedToChart: boolean;
  disconnected: boolean | null;
  socket: any | null;
}

const initialState: ISessionData = {
  started: false,
  starting: false,
  connected: false,
  connectingToChart: false,
  connectedToChart: false,
  disconnected: null,
  socket: null,
};

import {
  createAsyncThunkWithErrH,
} from './with-err-h';

import {
  addThunk
} from './add-thunk';

const url = "http://localhost:4200";

export const startSession = createAsyncThunkWithErrH("session/startSession",
  async ({}: {}, { dispatch, getState }) => {
    const {started, connectedToChart, socket: s, connectingToChart} = (getState() as any).session;

    if ( s ) {
      throw new Error('Socket already created');
    }

    const socket  = io(url, {reconnectionDelayMax: 5000, autoConnect: false, timeout: 300});

    await ( new Promise<void>((resolve, reject) => {
      let _unsubscribe: () => void;
      const connectHandler = () => {
        _unsubscribe();
        resolve();
      };
      const connectErrorHandler = () => {
        _unsubscribe();
        reject('Failed to connect');
      };
      const disconnectHandler = () => {
        _unsubscribe();
        reject('Failed to connect');
      };
      _unsubscribe = () => {
        socket.off('connect', connectHandler);
        socket.off('connect_error', connectErrorHandler);
        socket.off('reconnect_error', connectErrorHandler);
        socket.off('disconnect', disconnectHandler);
      };
      socket.on('connect', connectHandler);
      socket.on('disconnect', disconnectHandler);
      socket.on('connect_error', connectErrorHandler);
      socket.on('reconnect_error', connectErrorHandler);
      
      socket.connect();
    }));

    return {
      socket,
      connected: true,
    };
  }
);

export const addDisconnectHandler = createAsyncThunkWithErrH("session/addDisconnectHandler",
  async ({}: {}, { dispatch, getState }) => {
    const {
      socket
    } = (getState() as any).session;

    await ( new Promise<void>((resolve, reject) => {
      let _unsubscribe: () => void;
      const disconnectHandler = () => {
        _unsubscribe();
        resolve();
      };
      _unsubscribe = () => {
        socket.off('disconnect', disconnectHandler);        
      };
      socket.on('disconnect', disconnectHandler);
    }));

    return {
      socket,
      connected: false,
      disconnected: true,
    };
  }
);

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    addThunk(builder,
      startSession,
      s => s.starting,
      s => s.started,
      (s, v) => s.starting = v,
      (s, v) => s.started = v 
    )
    addThunk(builder,
      addDisconnectHandler,
      null,
      s => s.disconnectHandlerAdded,
      null,
      (s, v) => s.disconnectHandlerAdded = v 
    );
  }
});

export default sessionSlice.reducer;

// export const { incrementCounter } = appSlice.actions;
