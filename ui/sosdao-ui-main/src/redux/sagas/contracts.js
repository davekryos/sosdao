import { ethers } from "ethers";
import { zip } from "ramda";
import { all, put, select, take } from "redux-saga/effects";
import { getContract as getWagmiContract, getProvider } from "@wagmi/core";

import ABIS from "../abis";

import { isNetworkSupported } from "./network";

export function* getContract(contractName, provider = null) {
  let contract = yield select((state) => state.contracts[contractName]);

  while (!contract) {
    yield take("FETCHED_CONTRACTS");
    contract = yield select((state) => state.contracts[contractName]);
  }

  if (provider) {
    contract = {
      ...contract,
      signerOrProvider: provider,
    };
  }

  return getWagmiContract(contract);
}

export function* setRegistry() {
  const isSupported = yield isNetworkSupported();
  if (isSupported) {
    const network = yield select((state) => state.network.name);
    yield put({ type: "SET_REGISTRY", payload: { network } });
  }
}

export function* fetchViaRegistry(action) {
  const provider = yield getProvider();
  const Registry = yield getContract("Registry");

  const address = yield Registry.connect(provider).get(
    ethers.utils.formatBytes32String(action.contract),
  );

  return address;
}

export function* fetchContracts() {
  yield put({ type: "FETCHING_CONTRACTS" });

  const CONTRACT_NAMES = ["POOL_MANAGER", "MINT", "AUTHORITY"];
  const CONTRACT_IDS = {
    POOL_MANAGER: "PoolManager",
    MINT: "Mint",
    AUTHORITY: "Authority",
  };

  let contracts = yield all(
    CONTRACT_NAMES.map((name) => fetchViaRegistry({ contract: name })),
  );

  contracts = zip(CONTRACT_NAMES, contracts);

  contracts = contracts.map(([name, address]) => {
    return {
      [CONTRACT_IDS[name]]: { abi: ABIS[name].abi, address },
    };
  });

  yield put({
    type: "SET_CONTRACTS",
    payload: contracts,
  });

  yield put({
    type: "FETCHED_CONTRACTS",
  });
}
