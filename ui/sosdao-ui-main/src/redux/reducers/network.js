import { BigNumber } from "ethers";

import { chainIds } from "../data/chains";
import nativeAssets from "../data/nativeAssets";

const INITIAL_STATE = {
  chainId: null,
  name: null,
  isSupported: false,
  nativeAsset: null,
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
    case "SET_NETWORK":
      const chainId = BigNumber.from(payload.chainId).toNumber();

      if (chainId === state.chainId) return state;

      return {
        ...state,
        chainId,
        name: chainIds[chainId],
        nativeAsset: nativeAssets[chainId],
      };

    case "NETWORK_SUPPORTED":
      return { ...state, isSupported: true };
    case "NETWORK_NOT_SUPPORTED":
      return { ...state, isSupported: false };
    case "UNSET_NETWORK":
      return INITIAL_STATE;
    default:
      return state;
  }
};

export default reducer;
