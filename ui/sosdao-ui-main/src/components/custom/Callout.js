import { Card, Container } from "react-bootstrap";

export default function NoFunds({ message }) {
  return (
    <Container className="my-4 text-white text-center">
      <Card className="mx-4">
        <h4>{message}</h4>
      </Card>
    </Container>
  );
}
