import { call, select, take } from "redux-saga/effects";
import { eventChannel } from "redux-saga";
import { getProvider } from "../sagas/provider";

export function createEventListener(contract, filter, eventParser) {
  console.info(`Subscribing to channel for ${contract.address}.`);
  return eventChannel((emit) => {
    const handler = (...args) => {
      const event = {
        ...eventParser(...args),
        blockNumber: args[args.length - 1].blockNumber,
      };
      emit(event);
    };

    contract.on(filter, handler);

    const unsubscribe = () => {
      console.info(`Ubsubscribing from channel for ${contract.address}.`);
      contract.off(filter);
    };

    return unsubscribe;
  });
}

export function* listenForEvent(contract, filter, eventParser, eventHandler) {
  const provider = yield getProvider();
  const startBlockNumber = yield provider.getBlockNumber();

  const currentAccount = yield select((state) => state.account.account);

  if (!currentAccount) return;

  const channel = yield call(
    createEventListener,
    contract,
    filter,
    eventParser
  );

  while (true) {
    try {
      const event = yield take(channel);
      if (event.blockNumber > startBlockNumber) {
        yield eventHandler(channel, event);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
