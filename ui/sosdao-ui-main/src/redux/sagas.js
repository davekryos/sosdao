import {
  all,
  fork,
  put,
  select,
  spawn,
  takeEvery,
  takeLeading,
} from "redux-saga/effects";
import { BigNumber, ethers } from "ethers";
import { difference, zip } from "ramda";
import { getContract as getWContract } from "@wagmi/core";

import ABIS from "./abis";

import {
  accountChanged,
  fetchAccount,
  listenForAccountEvents,
} from "./sagas/account";
import { resetData } from "./sagas/data";
import { fetchDonations, fetchUserDonations } from "./sagas/donation";
import { fetchERC20, refreshAllowance, listenForApproval } from "./sagas/ERC20";
import { checkIfCurrentAccountHasCreatorRole, fetchFunds } from "./sagas/funds";
import { fetchMints, listenForMint } from "./sagas/mint";
import {
  checkIfNetworkSupported,
  networkChanged,
  setNetwork,
} from "./sagas/network";
import { getProvider, getNodeProvider, setProvider } from "./sagas/provider";
import { listenForApproveCheck } from "./sagas/requests";
import {
  fetchContracts,
  fetchViaRegistry,
  setRegistry,
} from "./sagas/contracts";
import { changeTheme } from "./sagas/theme";

export default function* rootSaga() {
  yield all([
    fork(setProvider),
    takeEvery("SET_PROVIDER", setNetwork),
    takeEvery("SET_PROVIDER", listenForAccountEvents),
    takeEvery("SET_NETWORK", resetData),
    takeEvery("SET_NETWORK", checkIfNetworkSupported),
    takeEvery("NETWORK_SUPPORTED", fetchAccount),
    takeEvery("NETWORK_SUPPORTED", setRegistry),
    takeEvery("SET_REGISTRY", fetchContracts),
    takeEvery("SET_ACCOUNT", checkIfCurrentAccountHasCreatorRole),
    takeEvery("SET_ACCOUNT", fetchUserDonations),
    takeEvery("SET_ACCOUNT", fetchMints),
    takeEvery("FETCHED_CONTRACTS", fetchFunds),
    takeLeading("FETCH_USER_DONATIONS", fetchUserDonations),
    takeLeading("FETCH_REQUESTS", fetchRequests),
    takeLeading("FETCH_REQUEST_APPROVAL_DETAILS", fetchRequestApprovalDetails),
    takeLeading("FETCH_FUND_MANAGER", fetchViaRegistry),
    takeLeading("FETCH_DONATION", fetchViaRegistry),
    takeLeading("FETCH_SOS", fetchViaRegistry),
    takeLeading("FETCH_GOVERNOR", fetchViaRegistry),
    takeEvery("FETCH_ERC20", fetchERC20),
    takeEvery("FETCH_DONATIONS", fetchDonations),
    takeEvery("FETCH_FUND_BALANCES", fetchFundBalances),
    takeEvery("FETCH_REQUEST", fetchRequest),
    takeEvery("LISTEN_FOR_APPROVAL", listenForApproval),
    takeEvery("LISTEN_FOR_MINT", listenForMint),
    takeEvery("LISTEN_FOR_APPROVE_CHECK", listenForApproveCheck),
    takeEvery("REFRESH_ALLOWANCE", refreshAllowance),
    takeLeading("ACCOUNT_CHANGED", accountChanged),
    takeEvery("NETWORK_CHANGED", networkChanged),
    takeEvery("NOTIFICATION", notify),
    takeEvery("SET_MODE", changeTheme),
  ]);
}

function* notify({ payload }) {
  yield put({ type: "SET_NOTIFICATION", payload });
}

function* fetchFundBalances({ payload: { fundId, fundAddress } }) {
  try {
    const provider = yield getProvider();
    const Pool = yield getWContract({
      address: fundAddress,
      abi: ABIS["POOL"].abi,
    });

    const allowedTokens = yield Pool.connect(provider).getEnabledAssets();
    const tokenBalances = [];

    for (let i = 0; i < allowedTokens.length; i++) {
      if (allowedTokens[i] == ethers.constants.AddressZero) {
        tokenBalances.push(yield Pool.connect(provider).getNativeBalance());
      } else {
        tokenBalances.push(
          yield Pool.connect(provider).getERC20Balance(allowedTokens[i]),
        );
      }
    }

    const balances = zip(tokenBalances, allowedTokens);

    yield put({
      type: "SET_FUND_BALANCES",
      payload: {
        id: fundId,
        balances,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

function* fetchRequest({ requestId }) {
  try {
    if (requestId) {
      const provider = yield getProvider();
      const Governor = yield select((state) => state.contracts.Governor);

      const filter = Governor.filters.RequestCreated(BigNumber.from(requestId));

      let requests = yield Governor.connect(provider).queryFilter(
        filter,
        7457687,
      );

      if (requests.length) {
        let request = requests.map((request) => request.args)[0];
        request = {
          id: request.id.toNumber(),
          fundId: request.fundId.toNumber(),
          amount: request.amount,
          description: request.description,
          token: request.token,
        };

        yield spawn(fetchRequest, request);

        yield put({
          type: "FETCH_REQUEST_SUCCESS",
          payload: request,
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function* fetchRequestDetail({ requestId }) {
  try {
    const Governor = yield select((state) => state.contracts.Governor);

    if (Governor) {
      const [pending, all] = yield Governor.getApprovalStatus(requestId);
      const approved = all.toNumber() - pending.toNumber();

      yield put({
        type: "FETCH_REQUEST_DETAIL_SUCCESS",
        payload: {
          id: requestId,
          details: {
            approvalStatus: [pending.toNumber(), approved, all.toNumber()],
          },
        },
      });
    } else {
      yield fetchViaRegistry({ contract: "GOVERNOR" });
      yield fetchRequestDetail({ requestId });
    }
  } catch (error) {
    console.error(error);
  }
}

function* fetchRequestApprovalDetails({ requestId }) {
  try {
    const Governor = yield select((state) => state.contracts.Governor);
    let checks = yield Governor.getChecks(requestId);
    let remainingChecks = yield Governor.getRemainingChecks(requestId);

    checks = checks.map((check) => ethers.utils.parseBytes32String(check));

    remainingChecks = remainingChecks.map((check) =>
      ethers.utils.parseBytes32String(check),
    );

    const approvedChecks = difference(checks, remainingChecks);
    let mappedChecks = [];

    let i = 0;
    while (i < approvedChecks.length) {
      mappedChecks[i] = [
        approvedChecks[i],
        yield Governor.getApprover(
          requestId,
          ethers.utils.formatBytes32String(approvedChecks[i]),
        ),
      ];
      i++;
    }

    yield put({
      type: "FETCH_REQUEST_DETAIL_SUCCESS",
      payload: {
        id: requestId,
        details: {
          remainingChecks,
          approvedChecks: mappedChecks,
          checksCount: remainingChecks.length + approvedChecks.length,
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
}

function* fetchRequests({ fundId }) {
  const provider = yield getNodeProvider();
  const Governor = yield select((state) => state.contracts.Governor);
  const filter = Governor.filters.RequestCreated(null, BigNumber.from(fundId));

  let requests = yield Governor.connect(provider).queryFilter(filter, 7457687);

  requests = requests
    .map((request) => request.args)
    .map((request) => ({
      id: request.id.toNumber(),
      fundId: request.fundId.toNumber(),
      amount: request.amount,
      description: request.description,
      token: request.token,
    }));

  for (const request of requests) {
    yield put({
      type: "FETCH_REQUEST_SUCCESS",
      payload: request,
    });
    yield spawn(fetchRequestDetail, { requestId: request.id });
  }
}
