import { all, put, select } from "redux-saga/effects";
import { ethers } from "ethers";
import {
  getAccount,
  getContract as getWContract,
  readContract,
} from "@wagmi/core";

import { getContract } from "./contracts";
import { getProvider } from "./provider";
import { listenForEvent } from "../channels/eventListener";
import { getABI } from "../../helpers/abi";

export function* listenForApproval({ payload: { tokenAddress } }) {
  const provider = yield getProvider();
  const currentAccount = yield select((state) => state.account.account);
  const DonationContract = yield getContract("Donation");

  const abi = getABI("ERC20");

  const contract = getWContract({ abi, address: tokenAddress }).connect(
    provider
  );

  const filter = contract.filters.Approval(
    currentAccount,
    DonationContract.address
  );

  yield listenForEvent(
    contract,
    filter,
    (owner, spender, value) => ({
      owner,
      spender,
      value,
      tokenAddress: tokenAddress,
    }),
    function* (channel, _payload) {
      yield refreshAllowance({ payload: { tokenAddress } });
      yield put({ type: "EXIT_TX_STATE" });
      yield put({
        type: "NOTIFICATION",
        payload: {
          type: "success",
          title: "Success",
          message: "Successfully approved.",
        },
      });
      yield channel.close();
    }
  );
}

export function* refreshAllowance({ payload: { tokenAddress } }) {
  try {
    if (!tokenAddress) return;

    const abi = getABI("ERC20");

    const DonationContract = yield getContract("Donation");

    const token = yield select((state) => state.data.tokens[tokenAddress]);

    const previousAllowance = yield select(
      (state) => state.account.allowance[tokenAddress]
    );

    const allowance = yield readContract({
      address: tokenAddress,
      abi,
      functionName: "allowance",
      args: [getAccount().address, DonationContract.address],
    });

    const parsedAllowance = parseFloat(
      ethers.utils.formatUnits(allowance, token.decimals)
    );

    if (previousAllowance !== parsedAllowance) {
      yield put({
        type: "SET_ALLOWANCE",
        payload: { tokenAddress, allowance },
      });
    }
  } catch (error) {
    console.log(error);

    yield put({
      type: "NOTIFICATION",
      payload: {
        type: "error",
        title: "Error",
        message: error.message,
      },
    });
  }
}

export function* fetchERC20({ payload: { address } }) {
  try {
    yield put({ type: "FETCHING_TOKEN" });

    const abi = getABI("ERC20");

    const [name, symbol, decimals] = yield all([
      readContract({ address, abi, functionName: "name" }),
      readContract({ address, abi, functionName: "symbol" }),
      readContract({ address, abi, functionName: "decimals" }),
    ]);

    yield put({
      type: "INSERT_TOKEN",
      payload: {
        address,
        token: { name, symbol, decimals: decimals.toNumber() },
      },
    });
  } catch (error) {
    console.error(error);
  }
}
