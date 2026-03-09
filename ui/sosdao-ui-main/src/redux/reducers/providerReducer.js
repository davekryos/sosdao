import { ethers } from "ethers";

const INITIAL_STATE = {
  NODES: {
    hardhat: new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_LOCAL_NODE
    ),
    localhost: new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_LOCAL_NODE
    ),
    fuji: new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_FUJI_NODE
    ),
    avalanche: new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_AVALANCHE_NODE
    ),
    sosTestnet: new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_SOS_TEST_NODE
    ),
  },
  provider: null,
  URL: {
    hardhat: process.env.REACT_APP_LOCAL_NODE,
    localhost: process.env.REACT_APP_LOCAL_NODE,
    fuji: process.env.REACT_APP_FUJI_NODE,
    avalanche: process.env.REACT_APP_AVALANCHE_NODE,
    sosTestnet: process.env.REACT_APP_SOS_TEST_NODE,
  },
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
    case "SET_PROVIDER":
      return {
        ...state,
        provider: payload.provider,
      };
    default:
      return state;
  }
};

export default reducer;
