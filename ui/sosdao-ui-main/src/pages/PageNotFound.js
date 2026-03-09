import React from "react";
import { Container } from "react-bootstrap";

const PageNotFound = () => {
  return (
    <Container
      style={{
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1>Page Not Found...</h1>
    </Container>
  );
};

export default PageNotFound;
