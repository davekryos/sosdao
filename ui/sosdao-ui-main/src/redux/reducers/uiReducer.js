const INITIAL_STATE = {
  provider: { loading: false },
  network: { loading: true },
  account: { loading: true },
  funds: { loading: true },
  transaction: { pending: false, type: null },
  notification: null,
  donations: { loading: false },
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
    case "SET_NETWORK":
      return {
        ...state,
        network: { loading: false },
      };
    case "SET_ACCOUNT":
    case "UNSET_ACCOUNT":
      return {
        ...state,
        account: { loading: false },
      };
    case "SET_LOADING":
      return {
        ...state,
        [payload.data]: { loading: payload.state },
      };
    case "ENTER_TX_STATE":
      return {
        ...state,
        transaction: {
          pending: true,
          type: payload.txType,
          identifier: payload.identifier,
        },
      };
    case "EXIT_TX_STATE":
      return {
        ...state,
        transaction: { pending: false, type: null, identifier: null },
      };
    case "FETCHING_FUNDS":
      return {
        ...state,
        funds: { loading: true },
      };
    case "FETCHED_FUNDS":
      return {
        ...state,
        funds: { loading: false },
      };
    case "SET_NOTIFICATION":
      return {
        ...state,
        notification: payload,
      };
    case "CLEAR_NOTIFICATION":
      return {
        ...state,
        notification: null,
      };
    default:
      return state;
  }
};

export default reducer;
