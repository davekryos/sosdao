import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "react-bootstrap";
import { fetchFundBalances } from "../../redux/actions";
import Balance from "../custom/Balance";
import { ethers } from "ethers";

const FundBalances = ({ id }) => {
  const dispatch = useDispatch();
  const fund = useSelector((state) => state.data.funds[id]);
  const tokens = useSelector((state) => state.data.tokens);

  useEffect(() => {
    dispatch(fetchFundBalances(id, fund.address));
  }, []);

  return fund.balances ? (
    <div className="tw-text-center">
      {!fund.balances.length ? "No Donations" : null}
      {fund.balances.map(([balance, address]) =>
        address !== ethers.constants.AddressZero ? (
          <div key={`fund-${id}-balance-${address}`} style={{ fontSize: 24 }}>
            <Balance
              amount={balance}
              symbol={tokens[address].symbol}
              decimals={tokens[address].decimals}
            />
          </div>
        ) : (
          <div key={`fund-${id}-balance-${address}`} style={{ fontSize: 24 }}>
            <Balance amount={balance} symbol="SOS" decimals={18} />
          </div>
        ),
      )}
    </div>
  ) : (
    <Spinner animation="border" />
  );
};

export default FundBalances;
