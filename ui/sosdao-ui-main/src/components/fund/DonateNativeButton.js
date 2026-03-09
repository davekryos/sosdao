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

const DonateNativeButton = ({ chain, poolAddress, amount, setAmount }) => {
  const { config } = usePrepareContractWrite({
    address: poolAddress,
    abi: ABIS["POOL"].abi,
    functionName: "depositNative",
    chainId: chain?.id,
    enabled: amount > 0,
    overrides: {
      value: amount > 0 ? ethers.utils.parseEther(amount) : "0",
    },
  });

  const { data, write } = useContractWrite(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => setAmount(0),
  });

  const isDisabled = !write || isLoading || amount === 0;

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

export default DonateNativeButton;
