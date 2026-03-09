import { put, select } from "redux-saga/effects";

import { getProvider } from "./provider";

export function* isNetworkSupported() {
  const supportedChainIds = yield select(
    (state) => state.configuration.networks
  );

  const chainId = yield select((state) => state.network.chainId);

  const isSupported = supportedChainIds.find(
    (supportedChainId) => chainId === supportedChainId
  );

  return isSupported;
}

export function* checkIfNetworkSupported() {
  const isSupported = yield isNetworkSupported();

  if (isSupported) {
    yield put({ type: "NETWORK_SUPPORTED" });
  } else {
    yield put({ type: "NETWORK_NOT_SUPPORTED" });
  }
}

export function* setNetwork() {
  const provider = yield getProvider();
  const network = yield provider.getNetwork();

  yield put({
    type: "SET_NETWORK",
    payload: { name: network.name, chainId: network.chainId },
  });
}

export function* networkChanged(action) {
  const chainId = action.payload.chainId;

  yield put({
    type: "SET_NETWORK",
    payload: { chainId },
  });
}
