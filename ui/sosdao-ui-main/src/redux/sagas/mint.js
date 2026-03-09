import { put, select } from "redux-saga/effects";
import { listenForEvent } from "../channels/eventListener";

import { getNodeProvider, getProvider } from "../sagas/provider";
import { getContract } from "./contracts";

import { fetchBlockNumber } from "@wagmi/core";

export function* listenForMint({ payload: { fundId, fundAddress } }) {
  const currentAccount = yield select((state) => state.account.account);
  const provider = yield getProvider();
  const Mint = yield getContract("Mint", provider);
  const nfts = yield select((state) => state.account.nfts);

  const filter = Mint.filters.Transfer(null, currentAccount);

  yield listenForEvent(
    Mint,
    filter,
    (_from, _to, tokenId) => ({
      tokenId,
    }),
    function* (channel, { tokenId }) {
      if (!nfts.find((id) => tokenId.toNumber() === id)) {
        yield put({ type: "INSERT_TOKEN_ID", payload: { tokenId } });
        yield put({ type: "EXIT_TX_STATE" });
        yield put({ type: "MINTED_TOKEN", payload: { tokenId } });
        yield put({
          type: "FETCH_FUND_BALANCES",
          payload: { fundId, fundAddress },
        });
        yield put({
          type: "FETCH_DONATIONS",
          payload: { fundId },
        });
        yield put({
          type: "FETCH_USER_DONATIONS",
        });
        yield channel.close();
      }
    }
  );
}

export function* fetchMints(_action) {
  try {
    const currentAccount = yield select((state) => state.account.account);
    const url = `https://sos-backend.xyzteknoloji.com/nfts?to=${currentAccount}`;
    const response = yield fetch(url);
    let allNFTs = yield response.json();

    allNFTs = allNFTs.map(({ tokenId }) => parseInt(tokenId));

    yield put({
      type: "SET_NFTS",
      payload: { allNFTs },
    });
  } catch (error) {
    console.error(error);
  }
}
