export * from "./actions/account";

export const setFormData = (formName, key, value) => ({
  type: "SET_FORM_DATA",
  payload: { formName, key, value },
});

export const clearFormData = (formName) => ({
  type: "CLEAR_FORM_DATA",
  payload: { formName },
});

export const enterTX = (txType, identifier = null) => ({
  type: "ENTER_TX_STATE",
  payload: { txType, identifier },
});

export const exitTX = () => ({
  type: "EXIT_TX_STATE",
});

export const fetchContract = (contract) => ({
  type: `FETCH_${contract}`,
  contract,
});

export const fetchFunds = () => ({ type: "FETCH_FUNDS" });

export const fetchFundBalances = (fundId, fundAddress) => ({
  type: "FETCH_FUND_BALANCES",
  payload: {
    fundId,
    fundAddress,
  },
});

export const fetchRequest = (requestId) => ({
  type: "FETCH_REQUEST",
  requestId,
});

export const fetchDonations = (fundId) => ({
  type: "FETCH_DONATIONS",
  payload: { fundId },
});

export const fetchRequestApprovalDetails = (requestId) => ({
  type: "FETCH_REQUEST_APPROVAL_DETAILS",
  requestId,
});

export const fetchRequests = (fundId) => ({
  type: "FETCH_REQUESTS",
  fundId,
});

export const fetchUserDonations = () => ({ type: "FETCH_USER_DONATIONS" });

export const fetchERC20 = (address) => ({
  type: "FETCH_ERC20",
  payload: { address },
});

export const fetchMints = () => ({
  type: "FETCH_MINTS",
});

export const listenForApproval = (tokenAddress, value) => ({
  type: "LISTEN_FOR_APPROVAL",
  payload: { tokenAddress, value },
});

export const listenForMint = (fundId, fundAddress) => ({
  type: "LISTEN_FOR_MINT",
  payload: { fundId, fundAddress },
});

export const refreshAllowance = (tokenAddress) => ({
  type: "REFRESH_ALLOWANCE",
  payload: { tokenAddress },
});

export const notify = (type, title, message) => ({
  type: "NOTIFICATION",
  payload: { type, message, title },
});
