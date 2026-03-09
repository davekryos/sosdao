import ImageCallout from "./ImageCallout";

export default function NotSupported() {
  return (
    <ImageCallout
      message="Please connect to a supported network."
      imgSrc="/images/network.jpeg"
      imgAlt="Network"
    />
  );
}
