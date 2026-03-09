import React, { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";

import { useSelector } from "react-redux";

import { ethers } from "ethers";

import { useAccount, useContractRead, useNetwork } from "wagmi";
import { erc20ABI } from "@wagmi/core";

import ApproveButton from "./ApproveButton";
import DonateButton from "./DonateButton";
import DonateNativeButton from "./DonateNativeButton";
import DonationInput from "./DonationInput";
import NotConnected from "../custom/NotConnected";
import NotSupported from "../custom/NotSupported";
import TokenBalance from "../custom/TokenBalance";

const DonationForm = ({ fundId }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const fund = useSelector((state) => state.data.funds[fundId]);
  const tokens = useSelector((state) => state.data.tokens);

  const supportedChainIds = useSelector(
    (state) => state.configuration.networks,
  );

  const [allowance, setAllowance] = useState(0);
  const [amount, setAmount] = useState("0");
  const [token, setToken] = useState(fund?.allowedTokens[0]);

  useContractRead({
    address: token,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address, fund.vaultAddress],
    watch: true,
    enabled: token != ethers.constants.AddressZero,
    onSuccess(data) {
      const value = parseFloat(
        ethers.utils.formatUnits(data, tokens[token].decimals),
      );

      setAllowance(value);
    },
  });

  useEffect(() => {
    if (fund?.allowedTokens.length) setToken(fund.allowedTokens[0]);
  }, [fund]);

  const isSupported = supportedChainIds.find(
    (supportedChainId) => chain?.id === supportedChainId,
  );

  if (!isConnected) {
    return (
      <Row className="justify-content-center">
        <Col xs={8}>
          <NotConnected />
        </Col>
      </Row>
    );
  }

  if (!isSupported) {
    return (
      <Row className="justify-content-center">
        <Col xs={8}>
          <NotSupported />
        </Col>
      </Row>
    );
  }

  return (
    <Form>
      <Row>
        <Col xs={12} className="tw-text-center tw-text-sm">
          <span>Wallet Balance: </span>
          <TokenBalance
            address={address}
            token={token}
            onClick={(value) => setAmount(value)}
          />
        </Col>
      </Row>
      <Row className="my-3 justify-content-center align-items-center">
        <Col xs={5} md={4} lg={2} className="px-1">
          <DonationInput
            placeholder="Donation"
            onChange={setAmount}
            value={amount}
          />
        </Col>
        <Col xs={5} md={3} lg={2} className="px-1">
          <select
            onChange={(e) => setToken(e.target.value)}
            className="browser-default custom-select"
          >
            {fund.allowedTokens.map((address, index) => {
              if (address == ethers.constants.AddressZero) {
                return (
                  <option key={index} value={address}>
                    {"SOS"}
                  </option>
                );
              } else {
                return (
                  <option key={index} value={address}>
                    {tokens[address].symbol}
                  </option>
                );
              }
            })}
          </select>
        </Col>
      </Row>

      <Row className="my-3 justify-content-center">
        <Col xs={5} md={4} lg={2} className="px-1">
          {token != ethers.constants.AddressZero && (
            <ApproveButton
              allowance={allowance}
              chain={chain}
              tokenAddress={token}
              vaultAddress={fund.vaultAddress}
              amount={amount}
              decimals={tokens[token].decimals}
            />
          )}
        </Col>
        <Col xs={5} md={4} lg={2} className="px-1">
          {token != ethers.constants.AddressZero ? (
            <DonateButton
              allowance={allowance}
              chain={chain}
              tokenAddress={token}
              poolAddress={fund.address}
              amount={amount}
              setAmount={setAmount}
              decimals={tokens[token].decimals}
            />
          ) : (
            <DonateNativeButton
              chain={chain}
              poolAddress={fund.address}
              amount={amount}
              setAmount={setAmount}
            />
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default DonationForm;
