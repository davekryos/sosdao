import React from "react";

import { ethers } from "ethers";

import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import styles from "./styles.module.scss";

import Button from "../custom/Button";

import ABIS from "../../redux/abis";

const DonateButton = ({
  chain,
  tokenAddress,
  poolAddress,
  allowance,
  amount,
  decimals,
  setAmount,
}) => {
  const { config } = usePrepareContractWrite({
    address: poolAddress,
    abi: ABIS["POOL"].abi,
    functionName: "depositERC20",
    chainId: chain?.id,
    enabled: amount > 0 && allowance >= amount,
    args: [tokenAddress, ethers.utils.parseUnits(amount.toString(), decimals)],
  });

  const { data, write } = useContractWrite(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => setAmount(0),
  });

  const isDisabled = !write || isLoading || amount === 0 || amount > allowance;

  return (
    <Button
      disabled={isDisabled}
      onClick={() => write?.()}
      isLoading={isLoading}
      className={styles.formDonateButton}
    >
      Donate
    </Button>
  );
};

export default DonateButton;
