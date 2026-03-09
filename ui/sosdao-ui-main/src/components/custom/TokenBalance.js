import React from "react";
import { Spinner } from "react-bootstrap";
import { commify } from "ethers/lib/utils.js";
import { useBalance } from "wagmi";
import { ethers } from "ethers";

const TokenBalance = ({ address, token, onClick }) => {
  const { data, isError, isLoading } =
    token == ethers.constants.AddressZero
      ? useBalance({ address })
      : useBalance({ address, token });

  if (isLoading) return <Spinner />;
  if (isError) return null;

  return (
    <span
      className={onClick ? "balance cursor-pointer" : "balance"}
      onClick={() => onClick(data.value)}
    >
      {commify(parseFloat(data.formatted).toFixed(4))}{" "}
      <span>{data.symbol}</span>
    </span>
  );
};

export default TokenBalance;
