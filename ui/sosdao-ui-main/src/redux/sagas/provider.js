import { select, put } from "redux-saga/effects";
import { ethers } from "ethers";
import { getProvider as getWProvider } from "@wagmi/core";

export function* getProvider() {
  const provider = yield select((state) => state.providers.provider);

  return provider;
}

export function* getNodeProvider() {
  const network = yield select((state) => state.network);
  const providers = yield select((state) => state.providers);

  return new ethers.providers.StaticJsonRpcProvider(
    providers.URL[network.name],
    network.chainId
  );
}

export function* setProvider() {
  const { ethereum } = window;

  // if (!ethereum) {
  //   return yield put({ type: "NO_PROVIDER" });
  // }

  const provider = getWProvider();

  yield put({
    type: "SET_PROVIDER",
    payload: {
      provider,
    },
  });
}
