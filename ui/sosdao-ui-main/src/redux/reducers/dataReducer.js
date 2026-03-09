const INITIAL_STATE = {
  funds: {},
  tokens: {},
  requests: {},
  forms: {},
  donations: {},
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
    case "RESET_DATA":
      return INITIAL_STATE;
    case "SET_FORM_DATA":
      return {
        ...state,
        forms: {
          ...state.forms,
          [payload.formName]: {
            ...state.forms[payload.formName],
            [payload.key]: payload.value,
          },
        },
      };
    case "CLEAR_FORM_DATA":
      return {
        ...state,
        forms: {
          ...state.forms,
          [payload.formName]: null,
        },
      };
    case "FETCH_REQUEST_SUCCESS":
      return {
        ...state,
        requests: { ...state.requests, [payload.id]: payload },
      };
    case "FETCH_DONATIONS_SUCCESS":
      return {
        ...state,
        donations: { ...state.donations, [payload.fundId]: payload.donations },
      };
    case "FETCH_REQUEST_DETAIL_SUCCESS":
      return {
        ...state,
        requests: {
          ...state.requests,
          [payload.id]: { ...state.requests[payload.id], ...payload.details },
        },
      };
    case "INSERT_FUND":
      return {
        ...state,
        funds: { ...state.funds, [payload.id]: payload },
      };
    case "UPDATE_FUND":
      return {
        ...state,
        funds: { ...state.funds, [payload.id]: payload },
      };
    case "SET_FUND_BALANCES":
      return {
        ...state,
        funds: {
          ...state.funds,
          [payload.id]: {
            ...state.funds[payload.id],
            balances: payload.balances,
          },
        },
      };
    case "INSERT_TOKEN":
      return {
        ...state,
        tokens: { ...state.tokens, [payload.address]: payload.token },
      };
    case "INSERT_DONATION":
      const newDonations = [
        ...state.donations[payload.fundId],
        payload.donation,
      ];
      return {
        ...state,
        donations: {
          ...state.donations,
          [payload.fundId]: newDonations,
        },
      };
    default:
      return state;
  }
};

export default reducer;
