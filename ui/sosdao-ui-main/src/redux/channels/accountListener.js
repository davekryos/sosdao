import { eventChannel } from "redux-saga";
import { watchAccount } from "@wagmi/core";

export function createAccountListener() {
  return eventChannel((emit) => {
    const unwatch = watchAccount((_account) => {
      emit({ type: "ACCOUNT_CHANGED" });
    });

    return unwatch;
  });
}
