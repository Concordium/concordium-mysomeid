import {
  JsonRpcProvider,
  StaticJsonRpcProvider
} from "@ethersproject/providers";
import {
  BigNumber,
  BigNumberish
} from "ethers";
import {
  // Addresses,
  NetworkId,
} from "../constants/network-id";

export interface IJsonRPCError {
  readonly message: string;
  readonly code: number;
}

export interface IBaseAsyncThunk {
  readonly networkId: NetworkId;
  readonly provider: StaticJsonRpcProvider | JsonRpcProvider;
  readonly addresses: any;
}

