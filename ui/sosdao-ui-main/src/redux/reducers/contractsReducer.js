import ABIS from "../abis";

const REGISTRY_ADDRESSES = {
  avalanche: process.env.REACT_APP_AVALANCHE_REGISTRY_ADDRESS,
  fuji: process.env.REACT_APP_FUJI_REGISTRY_ADDRESS,
  localhost: process.env.REACT_APP_LOCAL_REGISTRY_ADDRESS,
  hardhat: process.env.REACT_APP_LOCAL_REGISTRY_ADDRESS,
  sosTestnet: process.env.REACT_APP_SOS_TEST_REGISTRY_ADDRESS,
};

const INITIAL_STATE = {};

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_REGISTRY":
      return {
        ...state,
        Registry: {
          abi: ABIS["REGISTRY"].abi,
          address: REGISTRY_ADDRESSES[action.payload.network],
        },
      };
    case "SET_CONTRACTS":
      return {
        ...state,
        ...action.payload.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      };
    case "FETCH_CONTRACT_SUCCESS":
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export default reducer;
