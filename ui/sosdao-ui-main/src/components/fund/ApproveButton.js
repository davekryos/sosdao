import React from "react";
import { useDispatch } from "react-redux";

import { ethers } from "ethers";

import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { erc20ABI } from "@wagmi/core";

import styles from "./styles.module.scss";

import Button from "../custom/Button";

const ApproveButton = ({
  chain,
  tokenAddress,
  vaultAddress,
  allowance,
  amount,
  decimals,
}) => {
  const dispatch = useDispatch();

  const { config } = usePrepareContractWrite({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "approve",
    chainId: chain?.id,
    enabled: ethers.utils.parseUnits(amount.toString(), decimals),
    args: [vaultAddress, ethers.utils.parseUnits(amount.toString(), decimals)],
  });

  const { data, write } = useContractWrite(config);

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      dispatch({
        type: "NOTIFICATION",
        payload: {
          type: "success",
          title: "Success",
          message: "Successfully approved.",
        },
      });
    },
  });

  const isDisabled = !write || isLoading || amount === 0 || amount <= allowance;

  return (
    <Button
      disabled={isDisabled}
      onClick={() => write?.()}
      isLoading={isLoading}
      className={styles.formApproveButton}
    >
      Approve
    </Button>
  );
};

export default ApproveButton;
