import React from "react";
import { useSelector } from "react-redux";
import Balance from "../custom/Balance";

const NativeBalance = ({ amount }) => {
  const nativeAsset = useSelector((state) => state.network.nativeAsset);

  return (
    <Balance
      amount={amount}
      decimals={nativeAsset.decimals}
      symbol={nativeAsset.symbol}
    ></Balance>
  );
};

export default NativeBalance;
