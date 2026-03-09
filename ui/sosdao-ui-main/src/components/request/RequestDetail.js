import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { Col, Container, Row, Spinner, Card } from "react-bootstrap";
import {
  fetchFunds,
  fetchRequest,
  fetchRequestApprovalDetails,
  enterTX,
  notify,
  exitTX,
} from "../../redux/actions";
import { ethers, BigNumber } from "ethers";
import Balance from "../custom/Balance";
import Button from "../custom/Button";
import INTERFACES from "../../redux/interfaces";
import styles from "./styles.module.scss";

const RequestDetail = (props) => {
  const dispatch = useDispatch();

  const requestId = props.match.params.requestId;

  const inTX = useSelector((state) => state.ui.transaction);
  const currentAccount = useSelector((state) => state.account.account);
  const contracts = useSelector((state) => state.contracts);
  const tokens = useSelector((state) => state.data.tokens);
  const request = useSelector((state) => state.data.requests[requestId]);
  const fund = useSelector((state) =>
    request?.fundId ? state.data.funds[request.fundId] : null
  );

  const [isApprover, SetIsApprover] = useState(false);

  useEffect(() => {
    dispatch(fetchFunds());
  }, [request?.fundId, dispatch]);

  useEffect(() => {
    if (requestId) dispatch(fetchRequest(requestId));
  }, [requestId, dispatch]);

  useEffect(() => {
    if (request && currentAccount) {
      (async function () {
        const fundAddress = await contracts.FundManager.getFundAddress(
          request.fundId
        );
        const { FundV1 } = INTERFACES["FUNDV1"](fundAddress);

        const isApprover = await FundV1.hasRole(
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("APPROVER_ROLE")),
          currentAccount
        );

        SetIsApprover(isApprover);
      })();
    }
  }, [request, contracts, currentAccount]);

  useEffect(() => {
    if (requestId && !request?.remainingChecks) {
      dispatch(fetchRequestApprovalDetails(requestId));
    }

    const filter = contracts.Governor.filters.CheckApproved(
      BigNumber.from(requestId)
    );
    contracts.Governor.once(filter, () => {
      dispatch(fetchRequestApprovalDetails(requestId));
    });
  }, [requestId, request, dispatch, contracts.Governor]);

  const approveCheck = async (checkName) => {
    try {
      dispatch(enterTX("ApproveCheck", checkName));
      await contracts.Governor.approveCheck(
        requestId,
        ethers.utils.formatBytes32String(checkName)
      );
      dispatch({
        type: "LISTEN_FOR_APPROVE_CHECK",
        payload: { id: requestId, check: checkName },
      });
    } catch (error) {
      dispatch(notify("error", "Error", error.message));
      dispatch(exitTX());
    }
  };

  const displayApprovalStatus = (request) => {
    return request?.approvedChecks && request?.checksCount ? (
      <div>
        {request.approvedChecks?.length} / {request.checksCount}
      </div>
    ) : (
      <Spinner animation="border" size="sm" />
    );
  };

  return request ? (
    <Container className="my-4">
      <Card className="mb-5 mx-1 mx-md-1 mx-lg-5 p-3 p-md-4">
        <Row>
          <Col xs={12} md={9} className="text-center text-md-left">
            <h4>Request #{request.id}</h4>
            <h5>{fund?.name}</h5>
            <div className="mt-3 mt-md-0">
              <ReactMarkdown>{request.description}</ReactMarkdown>
            </div>
          </Col>

          <Col xs={12} md={3} className="h5 mt-4 text-center text-md-right">
            {request.token && tokens && tokens[request.token] ? (
              <Balance
                amount={request.amount}
                decimals={tokens[request.token].decimals}
                symbol={tokens[request.token].symbol}
              />
            ) : (
              <Spinner animation="border" size="sm" />
            )}
          </Col>
        </Row>
      </Card>
      <Card className="mt-4 mb-5 mx-1 mx-md-1 mx-lg-5 p-3 p-md-4">
        <Row>
          <Col xs={6} className="h4">
            Checks
          </Col>
          <Col xs={6} className="h5 text-right">
            {displayApprovalStatus(request)}
          </Col>
        </Row>

        {request.remainingChecks?.map((check, index) => (
          <Row key={`remaining-${index}`} className={styles.checkRow}>
            <Col xs={6} className={styles.checkName}>
              Check <br />
              {check}
            </Col>
            <Col xs={6} className={styles.checkApprover}>
              <Button
                isLoading={
                  inTX.type === "ApproveCheck" &&
                  inTX.pending &&
                  inTX.identifier === check
                }
                onClick={() => approveCheck(check)}
                disabled={!isApprover}
                className={styles.approveButton}
              >
                APPROVE
              </Button>
            </Col>
          </Row>
        ))}

        {request.approvedChecks?.map(([check, approver], index) => (
          <Row key={`remaining-${index}`} className={styles.checkRow}>
            <Col xs={6} className={styles.checkName}>
              Check <br />
              {check}
            </Col>
            <Col xs={6} className={styles.checkApprover}>
              Approved By
              <br />
              {approver}
            </Col>
          </Row>
        ))}
      </Card>
    </Container>
  ) : (
    <Container className="spinnerContainer">
      <Spinner animation="border" />
    </Container>
  );
};

export default RequestDetail;
