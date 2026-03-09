import React from "react";
import { useSelector } from "react-redux";
import { Container, Spinner } from "react-bootstrap";

import NoFunds from "../custom/NoFunds";
import FundItem from "./FundItem";

const FundList = (_props) => {
  const funds = useSelector((state) => Object.values(state.data.funds));
  const isLoading = useSelector((state) => state.ui.funds.loading);

  return isLoading ? (
    <Container className="spinnerContainer">
      <Spinner animation="border" />
    </Container>
  ) : (
    <Container className="tw-my-4">
      <>
        {!funds.length ? <NoFunds /> : null}
        {funds.map((fund) => {
          return <FundItem key={`fund_${fund.id}`} fundId={fund.id} />;
        })}
      </>
    </Container>
  );
};

export default FundList;
