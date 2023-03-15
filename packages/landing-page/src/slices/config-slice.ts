import {
  StaticJsonRpcProvider,
  JsonRpcProvider,
  JsonRpcSigner
} from "@ethersproject/providers";
import {
  createAsyncThunk,
  createSelector,
  createSlice
} from "@reduxjs/toolkit";
import {
  ethers
} from "ethers";
import {
  RootState
} from "../store";
import {
  setAll
} from "../helpers/set-all";
import {
  IBaseAsyncThunk,
  IJsonRPCError,
} from "./interfaces";

export const setProject = createAsyncThunk("configSlice/setProject",
  async ({ networkId, provider, projectAddress }: any, { dispatch, getState }) => {
    const config = (getState() as any).config;
    const {
      projectAddress: oldProject
    } = config;

    const {
      setActiveProjectLoadedProgress,
    } = configSlice.actions;

    const numSteps = 1;
    let step = 0;
    const nextStep = () => {
      console.log('Step ' + (++step));
      dispatch(setActiveProjectLoadedProgress({
        value: (step / numSteps),
      }));
    };

    /* if ( !provider) {
      throw new Error('No provider');
    } */

    if ( oldProject === projectAddress ) {
      throw new Error("Project the same as the requested ", projectAddress);
      return;
    }

    /* nextStep();
    const {
      fork,
    } = await getFork(provider, projectAddress);

    nextStep();
    const {
      addresses,
    } = await getAddressesFromFork(fork, provider);

    nextStep();
    const registry = await getRegistryFromFork(fork, provider);

    nextStep();
    const initialised = await fork.initialised();

    nextStep();
    const bondDepositoryFields = await readBondDepository(addresses.OlympusBondDepositoryV2, provider);

    nextStep();
    const blockLatest = await provider.getBlock("latest");
    const blockTime = blockLatest.timestamp;
    const blockTimeFetched = (new Date()).getTime() / 1000;

    // currentBlockTime, bondDepositoryV2Fields: any, provider: any, networkId: number, addresses: Addresses
    nextStep();
    const bondRegistry = await getBondRegistry(blockTime, bondDepositoryFields, provider, networkID, addresses );

    const bonds = Object.keys(bondRegistry).map(name => {
      return {
        ...bondRegistry[name],
        networks: {
          ...bondRegistry[name].addresses,
        },
      };
    });

    nextStep();
    const mainToken = IERC20__factory.connect(addresses.OlympusERC20Token, provider);
    const mainTokenName = await tryGet(mainToken.symbol());
    nextStep();
    const mainTokenDecimals = await tryGet(mainToken.decimals()); */

    return {
      networkId,
      provider,
      projectAddress,
      initialised: true,
      progress: 1,
      contracts: {
        token: {
          name: null,
          decimals: null,
          address: null,
        },
      },
    };
  }
);

export interface IConfigData {
  networkId: number | null;
  loadingProject: boolean | null;
  projectLoaded: boolean | null;
  provider: JsonRpcProvider | null;
  projectAddress: string | null;
  failedLoading: boolean | null;
  initialised: boolean | null;
  progress: number | null;
  contracts?: {
    token?: {
      name: string | null;
      decimals: number | null;
      address: string | null;
    };
  };
}

const initialState: IConfigData = {
  networkId: null,
  loadingProject: null,
  projectLoaded: null,
  provider: null,
  projectAddress: null,
  failedLoading: null,
  initialised: null,
  progress: null,
  contracts: {
    token: {
      name: null,
      decimals: null,
      address: null,
    },
  },
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setActiveProjectLoadedProgress(state, action) {
      state.progress = Math.min( Math.max( 0, action.payload.value || 0 ), 1 );
    },
    setProjectSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(setProject.pending, (state, action: any) => {
        state.projectAddress = action.meta.arg.projectAddress;
        state.failedLoading = false;
        state.loadingProject = true;
      })
      .addCase(setProject.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loadingProject = false;
        state.projectLoaded = true;
      })
      .addCase(setProject.rejected, (state, { error }) => {
        state.loadingProject = false;
        state.failedLoading = true;
        state.projectLoaded = false;
        console.error("Config: failed setting project", error.name, error.message, error.stack);
      });
  },
});

const baseInfo = (state: RootState) => state;

export default configSlice.reducer;

export const { setProjectSuccess } = configSlice.actions;

export const getConfigState = createSelector(baseInfo, x => x.config);
