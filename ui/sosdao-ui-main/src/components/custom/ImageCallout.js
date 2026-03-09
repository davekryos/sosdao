import { Container } from "react-bootstrap";

export default function ImageCallout({ imgSrc, imgAlt, message }) {
  return (
    <Container className="mt-2">
      <div className="tw-flex tw-justify-center tw-items-center">
        <img alt={imgAlt} width="100" src={imgSrc} className="display" />
        <h4 className="tw-text-lg tw-ml-4">{message}</h4>
      </div>
    </Container>
  );
}
