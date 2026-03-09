const INITIAL_STATE = {
  account: null,
  allowance: {},
  nfts: [],
  mintedToken: null,
  donations: [],
  hasCreatorRole: false,
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
    case "SET_ACCOUNT":
      if (payload === state.account) return state;
      return {
        ...state,
        account: payload,
        allowance: {},
      };
    case "UNSET_ACCOUNT":
      return INITIAL_STATE;
    case "SET_NFTS":
      if (state.nfts.length === payload.allNFTs.length) return state;
      return {
        ...state,
        nfts: payload.allNFTs,
      };
    case "SET_USER_DONATIONS":
      if (state.donations.length === payload.donations.length) return state;
      return {
        ...state,
        donations: payload.donations,
      };
    case "SET_ALLOWANCE":
      return {
        ...state,
        allowance: {
          ...state.allowance,
          [payload.tokenAddress]: payload.allowance,
        },
      };
    case "INSERT_TOKEN_ID":
      return {
        ...state,
        nfts: [...state.nfts, payload.tokenId.toNumber()],
      };
    case "MINTED_TOKEN":
      return {
        ...state,
        mintedToken: payload.tokenId.toNumber(),
      };
    case "CLEAR_MINTED_TOKEN":
      return {
        ...state,
        mintedToken: null,
      };
    case "SET_CREATOR_ROLE":
      return {
        ...state,
        hasCreatorRole: payload.hasCreatorRole,
      };
    default:
      return state;
  }
};

export default reducer;
