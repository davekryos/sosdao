import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Row, Col } from "react-bootstrap";
import { fetchRequests } from "../../redux/actions";
import Balance from "../custom/Balance";
import styles from "./styles.module.scss";

const RequestList = ({ fundId }) => {
  const dispatch = useDispatch();

  const Governor = useSelector((state) => state.contracts.Governor);
  const tokens = useSelector((state) => state.data.tokens);
  const requests = useSelector((state) =>
    Object.values(state.data.requests)
      .filter((request) => request.fundId === fundId)
      .sort((a, b) => b.id - a.id)
  );

  useEffect(() => {
    dispatch(fetchRequests(fundId));

    const filter = Governor.filters.RequestCreated();
    Governor.once(filter, () => {
      dispatch(fetchRequests(fundId));
    });
  }, [fundId, dispatch, Governor]);

  return (
    <>
      <Row className={styles.requestListHeader}>
        <Col
          xs={12}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Link
            style={{
              height: 40,
              width: 150,
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
            className={styles.createRequestButton}
            to={"/create-request/" + fundId}
          >
            Create Request
          </Link>
        </Col>
      </Row>

      {requests.length ? (
        requests.map((request) => {
          return (
            <Row
              className={styles.requestListRow}
              key={`request-${request.id}`}
            >
              <Col xs={12}>
                <NavLink to={`/request/${request.id}`}>
                  <Row>
                    <Col xs={4} className="text-left">
                      <small>
                        Approvals <br />
                      </small>
                      {request.approvalStatus ? (
                        <span>
                          {request.approvalStatus[1]} /{" "}
                          {request.approvalStatus[2]}
                        </span>
                      ) : null}
                    </Col>

                    <Col xs={8} className="text-right">
                      <small>
                        Amount <br />
                      </small>
                      <Balance
                        amount={request.amount}
                        decimals={tokens[request.token].decimals}
                        symbol={tokens[request.token].symbol}
                      />
                    </Col>
                  </Row>

                  <Row className="mt-2">
                    <Col xs={12} className="text-left">
                      <small>
                        Description <br />
                      </small>
                      <ReactMarkdown>{request.description}</ReactMarkdown>
                    </Col>
                  </Row>

                  <Row className="mt-2">
                    <Col xs={12} className="text-right text-white-50">
                      <small>ID #{request.id}</small>
                    </Col>
                  </Row>
                </NavLink>
              </Col>
            </Row>
          );
        })
      ) : (
        <div className="p-2">&nbsp;</div>
      )}
    </>
  );
};

export default RequestList;
