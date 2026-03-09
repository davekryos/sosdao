import React from "react";
import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";

import Balance from "../custom/Balance";

const DonationRow = ({ timestamp, donor, value, txHash, tokenAddress }) => {
  const token = useSelector((state) => state.data.tokens[tokenAddress]) ?? {
    symbol: "SOS",
    decimals: 18,
  };

  const chainId = useSelector((state) => state.network.chainId);

  function txScannerLink(txHash) {
    switch (chainId) {
      case 43114:
        return `https://snowtrace.io/tx/${txHash}`;
      case 43113:
        return `https://testnet.snowtrace.io/tx/${txHash}`;
      case 54211:
        return `https://explorer.testedge2.haqq.network/tx/${txHash}`;
      case 11235:
        return `https://explorer.haqq.network/tx/${txHash}`;
      default:
        return "#";
    }
  }

  return (
    <>
      <div className="tw-grid tw-grid-cols-2 tw-py-4 last:tw-pb-0 tw-mx-2 md:tw-mx-4">
        <div>
          <Balance
            amount={value}
            decimals={token.decimals}
            symbol={token.symbol}
          />
        </div>
        <div className="tw-text-xs tw-text-right tw-text-gray-600">
          {new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            year: "numeric",
            month: "long",
            hour: "numeric",
            minute: "numeric",
            timeZone: "Europe/Istanbul",
          }).format(new Date(timestamp * 1000))}
        </div>
        <div className="tw-text-xs tw-text-ellipsis tw-overflow-hidden">
          {donor}
        </div>
        <div className="tw-text-right tw-text-xs">
          <a href={txScannerLink(txHash)} target="_blank" rel="noreferrer">
            <FontAwesomeIcon icon={faExternalLink} />
          </a>
        </div>
      </div>
    </>
  );
};

export default DonationRow;
