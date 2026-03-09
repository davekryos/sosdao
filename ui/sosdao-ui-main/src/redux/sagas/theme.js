import { put } from "redux-saga/effects";

export function* changeTheme({ payload }) {
  yield put({
    type: "THEME_UPDATED",
    payload,
  });
}
