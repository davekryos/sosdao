import React from "react";
import { commify, formatUnits } from "ethers/lib/utils.js";

const Balance = ({ amount, decimals, symbol }) => {
  return (
    <span className="balance">
      {commify(formatUnits(amount, decimals))} <span>{symbol}</span>
    </span>
  );
};

export default Balance;
