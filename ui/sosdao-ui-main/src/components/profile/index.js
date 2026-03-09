import { ethers } from "ethers";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useSelector } from "react-redux";
import { Col, Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";

import styles from "./styles.module.scss";
import ERC20Balance from "./ERC20Balance";
import Button from "../custom/Button";
import Section from "../custom/Section";
import Capitalize from "../custom/Capitalize";
import SVGView from "../custom/SVGView";
import NftModal from "../custom/NftModal";
import NativeBalance from "./NativeBalance";

const Profile = () => {
  const [displayNFTCount, setDisplayNFTCount] = useState(5);
  const [modalShow, setModalShow] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const contracts = useSelector((state) => state.contracts);
  const currentAccount = useAccount();
  const network = useSelector((state) => state.network);
  const funds = useSelector((state) => state.data.funds);
  const userDonations = useSelector((state) => state.account.donations);
  const allNFTsCount = useSelector((state) => state.account.nfts.length);
  const allNFTs = useSelector((state) =>
    state.account.nfts.slice(0, displayNFTCount)
  );

  const openModal = (i) => {
    setSelectedTokenId(i);
    setModalShow(true);
  };

  const mostDonated = (donations) => {
    const mapped = Object.entries(
      donations
        .map((donation) => donation.donatedFundId)
        .reduce((acc, fundId) => {
          return acc[fundId]
            ? { ...acc, [fundId]: acc[fundId] + 1 }
            : { ...acc, [fundId]: 1 };
        }, {})
    ).sort((a, b) => b[1] - a[1]);

    return mapped.length ? funds[mapped[0][0]] : null;
  };

  const mapTotals = (donations) => {
    return Object.entries(
      donations.reduce((acc, { tokenAddress, amount }) => {
        return acc[tokenAddress]
          ? {
              ...acc,
              [tokenAddress]: acc[tokenAddress].add(amount),
            }
          : { ...acc, [tokenAddress]: amount };
      }, {})
    );
  };

  const updateScroller = (_e) => {
    let increment = Math.min(allNFTsCount, displayNFTCount + 5);
    setDisplayNFTCount(increment);
  };

  const AccountInfo = () => {
    return (
      <Section>
        <Row className="align-items-center justify-content-evenly">
          <Col className="text-center">
            <div className="title">Account</div>
            <FontAwesomeIcon className={styles.icon} icon={faCircleDot} />
            {currentAccount.address} (
            <Capitalize string={network.name} />)
          </Col>
        </Row>
      </Section>
    );
  };

  const TotalDonations = () => {
    return (
      <Section>
        <Row>
          <Col className="text-center">
            <div>
              <div className="title">Total Donations</div>
              <Row className="flex-wrap justify-content-center">
                {userDonations.length ? (
                  mapTotals(userDonations).map(([tokenAddress, amount]) => {
                    return (
                      <Col
                        style={{ maxWidth: "max-content" }}
                        className="h4"
                        key={`total_balance_${tokenAddress}`}
                      >
                        {tokenAddress == ethers.constants.AddressZero ? (
                          <NativeBalance amount={amount} />
                        ) : (
                          <ERC20Balance
                            tokenAddress={tokenAddress}
                            amount={amount}
                          />
                        )}
                      </Col>
                    );
                  })
                ) : (
                  <div className="font-italic">No donations yet.</div>
                )}
              </Row>
            </div>
          </Col>
        </Row>
      </Section>
    );
  };

  const MostDonated = () => {
    if (!userDonations.length) return null;
    return (
      <Section>
        <Row className="align-items-center justify-content-evenly">
          <Col className="text-center">
            <div>
              <div className="title">Most Donated Fund</div>
              <div className="h4">{mostDonated(userDonations)?.name}</div>
            </div>
          </Col>
        </Row>
      </Section>
    );
  };

  const NFTs = () => {
    console.log("userDonations", userDonations);
    console.log("allNFTsCount", allNFTsCount);
    console.log("allNFTs", allNFTs);
    if (!userDonations.length) return null;

    return (
      <Section>
        <Row className="justify-content-center">
          <Col className="text-center">
            <div className="title">NFTs</div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          {allNFTs.map((i, index) => (
            <Col
              style={{
                backgroundColor: "#64648e",
                borderRadius: 20,
                alignContent: "center",
                justifyContent: "center",
              }}
              key={index}
              className="m-2 pl-0 pr-0 pb-0 pt-0 nftHover profile-nft-container"
              onClick={() => openModal(i)}
            >
              {<SVGView contracts={contracts} tokenId={i}></SVGView>}
            </Col>
          ))}
        </Row>

        {allNFTsCount === allNFTs.length ? null : (
          <div className="d-flex justify-content-center mt-3">
            <Button onClick={updateScroller}>Load More</Button>
          </div>
        )}
      </Section>
    );
  };
  return (
    <Container className="my-4">
      {AccountInfo()}
      {TotalDonations()}
      {MostDonated()}
      {NFTs()}
      <NftModal
        setModalShow={() => setModalShow()}
        tokenId={selectedTokenId}
        contracts={contracts}
        modalShow={modalShow}
      />
    </Container>
  );
};

export default Profile;
