import React from "react";
import { Button as BootstrapButton, Spinner } from "react-bootstrap";

const Button = ({
  children,
  isLoading = false,
  isDisabled = false,
  ...rest
}) => {
  return (
    <BootstrapButton {...rest}>
      {isLoading ? (
        <Spinner
          style={{ marginRight: "0.5em" }}
          size="sm"
          animation="border"
        />
      ) : null}{" "}
      {children}
    </BootstrapButton>
  );
};

export default Button;
