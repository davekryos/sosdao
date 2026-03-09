import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchERC20 } from "../../redux/actions";
import { Spinner } from "react-bootstrap";
import Balance from "../custom/Balance";

const ERC20Balance = ({ tokenAddress, amount }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.data.tokens[tokenAddress]);

  useEffect(() => {
    if (token) return;
    if (tokenAddress) {
      dispatch(fetchERC20(tokenAddress));
    }
  }, [token, tokenAddress, dispatch]);

  return token ? (
    <Balance
      amount={amount}
      decimals={token.decimals}
      symbol={token.symbol}
    ></Balance>
  ) : (
    <Spinner size="sm" animation="border" />
  );
};

export default ERC20Balance;
