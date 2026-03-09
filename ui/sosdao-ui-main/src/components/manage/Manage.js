import { Col, Container, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Button from "../custom/Button";

export default function Manage() {
  const currentAccount = useSelector((state) => state.account);

  return currentAccount.hasCreatorRole ? (
    <Container className="text-center">
      <Row className="my-4">
        <Col>
          <div className="title">Manage</div>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button as={Link} to="/create-fund">
            Create Fund
          </Button>
        </Col>
      </Row>
    </Container>
  ) : null;
}
