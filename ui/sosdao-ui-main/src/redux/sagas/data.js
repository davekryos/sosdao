import { put, select } from "redux-saga/effects";

export function* resetData() {
  yield put({ type: "RESET_DATA" });
}
