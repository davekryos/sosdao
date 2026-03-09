import { call, put, select, take } from "redux-saga/effects";

import { getAccount } from "@wagmi/core";
import { createAccountListener } from "../channels/accountListener";

import { checkIfCurrentAccountHasCreatorRole } from "./funds";

export function* getCurrentAccount() {
  let currentAccount = yield select((state) => state.account);

  while (!currentAccount.account) {
    yield take("SET_ACCOUNT");
    currentAccount = yield select((state) => state.account);
  }

  return currentAccount;
}

export function* fetchAccount() {
  yield put({ type: "FETCHING_ACCOUNT" });

  const account = yield getAccount();

  if (account.address) {
    yield put({ type: "SET_ACCOUNT", payload: account.address });
  }
}

export function* listenForAccountEvents() {
  const channel = yield call(createAccountListener);

  while (true) {
    try {
      const event = yield take(channel);
      yield put(event);
    } catch (error) {
      console.error(error);
    }
  }
}

export function* unsetAccount() {
  yield put({ type: "UNSET_ACCOUNT" });
}

export function* accountChanged() {
  yield unsetAccount();
  yield fetchAccount();
  yield checkIfCurrentAccountHasCreatorRole();
}
