import React from "react";
import ReactMarkdown from "react-markdown";
import { Row, Col } from "react-bootstrap";

const FundHeader = ({ fund }) => {
  return (
    <>
      <Row className="justify-content-between">
        <Col xs={12} md={10} className="text-center text-md-left">
          <h3>{fund.name}</h3>
        </Col>
      </Row>
      <Row>
        <Col
          xs={12}
          className="mt-2 text-center text-md-left"
          style={{ fontSize: "0.9rem" }}
        >
          <ReactMarkdown>{fund.description}</ReactMarkdown>
        </Col>
      </Row>
    </>
  );
};

export default FundHeader;
