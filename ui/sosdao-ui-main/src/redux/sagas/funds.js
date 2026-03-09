import { ethers } from "ethers";
import { all, call, put } from "redux-saga/effects";
import { zip } from "ramda";
import { getProvider, getContract as getWContract } from "@wagmi/core";

import { getCurrentAccount } from "./account";
import { getContract } from "./contracts";
import { fetchERC20 } from "./ERC20";
import { getNodeProvider } from "./provider";
import ABIS from "../abis";

export function* fetchFunds(_action) {
  try {
    yield put({ type: "FETCHING_FUNDS" });

    let url = "https://sos-backend.xyzteknoloji.com/funds";
    const response = yield fetch(url);
    let funds = yield response.json();
    funds = funds.map(({ id, at, name, description }) => ({
      id,
      address: at,
      name,
      description,
    }));
    console.log(`- - - Funds - - -`);
    console.table(funds);
    yield all(funds.map((fund) => call(fetchFundDetails, fund)));
    yield put({ type: "FETCHED_FUNDS" });
  } catch (error) {
    console.log(error);
  }
}

export function* fetchFundDetails(fund) {
  try {
    const provider = yield getNodeProvider();
    const Pool = yield getWContract({
      address: fund.address,
      abi: ABIS["POOL"].abi,
    });

    const vaultAddress = yield Pool.connect(provider).getVaultAddress();
    const allowedTokens = yield Pool.connect(provider).getEnabledAssets();
    var tokenBalances = [];

    for (let i = 0; i < allowedTokens.length; i++) {
      if (allowedTokens[i] == ethers.constants.AddressZero) {
        tokenBalances.push(yield Pool.connect(provider).getNativeBalance());
      } else {
        tokenBalances.push(
          yield Pool.connect(provider).getERC20Balance(allowedTokens[i]),
        );
      }
    }
    /////////////////////////////////////////////////////////////////////////////
    // no need for balance set here ?
    /////////////////////////////////////////////////////////////////////////////

    tokenBalances = tokenBalances.map((balance) => balance.toString());

    const balances = zip(tokenBalances, allowedTokens); // remove later

    yield all(
      allowedTokens
        .filter((token) => token !== ethers.constants.AddressZero)
        .map((address) => call(fetchERC20, { payload: { address } })),
    );

    yield put({
      type: "INSERT_FUND",
      payload: {
        ...fund,
        allowedTokens,
        balances,
        vaultAddress,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export function* checkIfCurrentAccountHasCreatorRole() {
  const provider = yield getProvider();
  const currentAccount = yield getCurrentAccount();
  const Authority = yield getContract("Authority", provider);

  const hasCreatorRole = yield Authority.hasRole(
    6097896358761106533n,
    currentAccount.account,
  );

  yield put({
    type: "SET_CREATOR_ROLE",
    payload: { hasCreatorRole: hasCreatorRole[0] },
  });
}
