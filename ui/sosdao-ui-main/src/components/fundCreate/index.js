import React from "react";
import { Container, Card } from "react-bootstrap";
import { useSelector } from "react-redux";

import FundCreateForm from "./FundCreateForm";
import Callout from "../custom/Callout";

const FundCreate = (props) => {
  const currentAccount = useSelector((state) => state.account);

  return (
    <Container className="my-4">
      {currentAccount.hasCreatorRole ? (
        <Card className="mb-5 mx-1 mx-md-1 mx-lg-5 p-3 p-md-4">
          <FundCreateForm />
        </Card>
      ) : (
        <Callout message="Not authorized to create funds." />
      )}
    </Container>
  );
};

export default FundCreate;
