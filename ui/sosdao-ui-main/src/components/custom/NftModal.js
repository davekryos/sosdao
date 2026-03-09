import React from "react";
import { useDispatch } from "react-redux";
import { Modal, Col, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import SVGView from "./SVGView";
import Button from "./Button";

const NftModal = ({ setModalShow, tokenId, contracts, modalShow }) => {
  const dispatch = useDispatch();

  return (
    <Modal
      show={modalShow}
      onHide={() => {
        setModalShow(false);
      }}
    >
      <Modal.Header>
        <Modal.Title>Donation</Modal.Title>
      </Modal.Header>
      <Modal.Body className="svgModal">
        <SVGView contracts={contracts} tokenId={tokenId}></SVGView>
      </Modal.Body>
      <Modal.Footer className="d-block">
        <Row className="align-items-center">
          <Col className="flex-grow-1">
            <div
              className="d-flex text-dark"
              onClick={() => {
                navigator.clipboard.writeText(contracts.Mint.address);
              }}
            >
              <div>NFT Token Address</div>
              <div className="ml-2">
                <FontAwesomeIcon
                  className="cursor-pointer clickIcon"
                  icon={faCopy}
                />
              </div>
            </div>
          </Col>
          <Col
            style={{ maxWidth: "min-content" }}
            className="d-flex justify-content-end"
          >
            <Button
              className="d-block svgModalButton"
              onClick={() => {
                setModalShow(false);
                dispatch({ type: "CLEAR_MINTED_TOKEN" });
              }}
            >
              Close
            </Button>
          </Col>
        </Row>
      </Modal.Footer>
    </Modal>
  );
};
export default NftModal;
