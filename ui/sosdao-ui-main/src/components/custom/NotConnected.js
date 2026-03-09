import ImageCallout from "./ImageCallout";

export default function NotConnected() {
  return (
    <ImageCallout
      message="Please connect your wallet to donate."
      imgSrc="/images/blockchain-icon.svg"
      imgAlt="Account"
    />
  );
}
