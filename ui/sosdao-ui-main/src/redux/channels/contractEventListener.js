import { eventChannel } from "redux-saga";
import { watchContractEvent } from "@wagmi/core";

export function createContractEventListener(address, abi, eventName, func) {
  return eventChannel((emit) => {
    emit({
      type: "LISTENING_FOR_CONTRACT_EVENTS",
      payload: { address, eventName },
    });

    const listener = watchContractEvent(
      {
        address,
        abi,
        eventName,
      },
      (...args) => {
        func(...args);
      }
    );

    return listener;
  });
}
