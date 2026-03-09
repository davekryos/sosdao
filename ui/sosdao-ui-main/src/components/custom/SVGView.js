import { getContract } from "@wagmi/core";
import React from "react";
import { useProvider } from "wagmi";
import { useEffect, useState } from "react";

const SVGView = ({ tokenId, contracts }) => {
  const [SVG, SetSVG] = useState(null);
  const provider = useProvider();

  useEffect(() => {
    const fetch = async () => {
      const contract = getContract(contracts.Mint);
      const response = await contract.connect(provider).SVG(tokenId);

      SetSVG(response);
    };

    contracts && contracts.Mint && fetch();
  }, [contracts, tokenId]);

  return SVG ? (
    <div className="nft-container" dangerouslySetInnerHTML={{ __html: SVG }} />
  ) : null;
};

export default SVGView;
