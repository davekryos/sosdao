import { BigNumber, ethers } from "ethers";
import { put, select } from "redux-saga/effects";
import { listenForEvent } from "../channels/eventListener";

export function* listenForApproveCheck({ payload: { id, check } }) {
  const contract = yield select((state) => state.contracts.Governor);

  const filter = contract.filters.CheckApproved(
    BigNumber.from(id),
    ethers.utils.formatBytes32String(check)
  );

  yield listenForEvent(
    contract,
    filter,
    () => ({}),
    function* (channel, _payload) {
      yield put({ type: "EXIT_TX_STATE" });
      yield channel.close();
    }
  );
}
