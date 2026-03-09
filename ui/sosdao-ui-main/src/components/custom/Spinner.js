import { Container, Spinner as BSpinner } from "react-bootstrap";

export function Spinner() {
  return (
    <Container className="spinnerContainer">
      <BSpinner animation="border" />
    </Container>
  );
}
