import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useContractEvent, useAccount } from "wagmi";
import ReactMarkdown from "react-markdown";
import { BigNumber } from "ethers";
import { Container, Modal, Spinner, Tab, Tabs } from "react-bootstrap";

import styles from "./styles.module.scss";

import DonationForm from "./DonationForm";
import RequestList from "../request/RequestList";
import DonationList from "../donation/DonationList";
import SVGView from "../custom/SVGView";
import Button from "../custom/Button";
import FundBalances from "./FundBalances";

const Fund = (props) => {
  const dispatch = useDispatch();
  const { address: userAddress } = useAccount();

  const fund = useSelector(
    (state) => state.data.funds[props.match.params.fundId],
  );

  const [minted, setMinted] = useState(null);

  const contracts = useSelector((state) => state.contracts);

  const [modalVisible, setModalVisible] = useState(false);

  useContractEvent({
    address: contracts.Mint?.address,
    abi: contracts.Mint?.abi,
    eventName: "Transfer",
    listener(_from, _to, tokenId) {
      if (_to !== userAddress) return;
      dispatch({ type: "INSERT_TOKEN_ID", payload: { tokenId } });

      dispatch({
        type: "FETCH_FUND_BALANCES",
        payload: { fundId: fund.id, fundAddress: fund.address },
      });

      setMinted(tokenId);
      setModalVisible(true);
    },
  });

  useContractEvent({
    address: contracts.Registry?.address,
    abi: contracts.Registry?.abi,
    eventName: "DonationRegistered",
    async listener(pool, donor, asset, amount, ...rest) {
      if (pool != fund.id) return;

      const block = await rest[0].getBlock();

      const donation = {
        tokenAddress: asset,
        value: BigNumber.from(amount),
        donatedFundId: pool,
        donor: donor,
        txHash: rest[0].transactionHash,
        timestamp: block.timestamp,
        blocknumber: rest[0].blockNumber,
      };

      dispatch({
        type: "INSERT_DONATION",
        payload: { fundId: fund.id, donation },
      });
    },
  });

  return fund ? (
    <Container>
      <div className="bg-brand-light tw-divide-y tw-rounded">
        <div className="tw-p-2 tw-py-4 tw-mt-2">
          <div className="md:tw-hidden tw-text-center">
            <img
              className="tw-inline-block"
              width="100"
              alt=""
              src="/images/sos_logo_dark.svg"
            />
            <div className="tw-mt-2">
              <h3 className="tw-text-lg">{fund.name}</h3>
              <div className="tw-italic tw-font-thin tw-text-sm">
                <ReactMarkdown>{fund.description}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="tw-hidden md:tw-flex tw-justify-between tw-items-center tw-mx-4">
            <div>
              <h3 className="tw-text-2xl">{fund.name}</h3>
              <div className="tw-italic tw-font-thin tw-text-sm">
                <ReactMarkdown>{fund.description}</ReactMarkdown>
              </div>
            </div>
            <img
              className="tw-inline-block"
              width="200"
              alt=""
              src="/images/sos_logo_dark.svg"
            />
          </div>
        </div>

        <div className="tw-py-4">
          <DonationForm fundId={fund.id} />
        </div>

        <div className="tw-py-4">
          <div className={styles.tabWrapper}>
            <Tabs defaultActiveKey="donations" className={styles.tabs}>
              <Tab eventKey="balances" title="Balances">
                <FundBalances id={fund.id} />
              </Tab>
              <Tab eventKey="donations" title="Donations">
                <DonationList fundId={fund.id} />
              </Tab>
              {fund?.requestable ? (
                <Tab eventKey="requests" title="Requests">
                  <RequestList fundId={fund.id} />
                </Tab>
              ) : (
                <></>
              )}
            </Tabs>
          </div>
        </div>

        <Modal
          show={modalVisible}
          onHide={() => {
            setModalVisible(false);
          }}
        >
          <Modal.Header>
            <Modal.Title>Thank you for donating!</Modal.Title>
          </Modal.Header>
          <Modal.Body className="svgModal">
            <SVGView contracts={contracts} tokenId={minted}></SVGView>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="svgModalButton"
              onClick={() => {
                setModalVisible(false);
                dispatch({ type: "CLEAR_MINTED_TOKEN" });
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Container>
  ) : (
    <Container className="spinnerContainer">
      <Spinner animation="border" />
    </Container>
  );
};

export default Fund;
