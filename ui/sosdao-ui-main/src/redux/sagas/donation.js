import { put, select } from "redux-saga/effects";
import { BigNumber } from "ethers";

export function* fetchDonations({ payload: { fundId } }) {
  yield put({
    type: "SET_LOADING",
    payload: { data: "donations", state: true },
  });

  const url = `https://sos-backend.xyzteknoloji.com/donations/${fundId}`;
  const response = yield fetch(url);
  let donations = yield response.json();

  donations = donations.map((donation) => ({
    tokenAddress: donation.asset,
    value: BigNumber.from(donation.amount),
    donatedFundId: donation.pool,
    donor: donation.donor,
    txHash: donation.txHash,
    timestamp: donation.timestamp,
    blocknumber: donation.blocknumber,
  }));

  yield put({
    type: "FETCH_DONATIONS_SUCCESS",
    payload: { fundId, donations },
  });

  yield put({
    type: "SET_LOADING",
    payload: { data: "donations", state: false },
  });
}

export function* fetchUserDonations(_action) {
  const currentAccount = yield select((state) => state.account.account);
  const url = `https://sos-backend.xyzteknoloji.com/donations?donor=${currentAccount}`;
  const response = yield fetch(url);
  let donations = yield response.json();

  donations = donations.map((donation) => ({
    tokenAddress: donation.asset,
    amount: BigNumber.from(donation.amount),
    donatedFundId: donation.pool,
  }));

  yield put({
    type: "SET_USER_DONATIONS",
    payload: { donations },
  });
}
