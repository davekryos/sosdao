import * as React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Modal } from "react-bootstrap";

const UserTab = ({ setModalShow, modalShow }) => {
  return (
    <Modal
      show={modalShow}
      onHide={() => {
        setModalShow(false);
      }}
    >
      <Modal.Body>
        <Row>
          <Col>
            <Link onClick={() => setModalShow(false)} to={`/profile`}>
              Profile
            </Link>
          </Col>
          <Col>
            <Link
              onClick={() => {
                setModalShow(false);
              }}
            >
              Close
            </Link>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default UserTab;
