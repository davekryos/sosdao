import { EthereumClient } from "@web3modal/ethereum";
import { Web3Modal as Modal } from "@web3modal/react";

export default function Web3Modal({ client, chains, defaultChain }) {
  const ethereumClient = new EthereumClient(client, chains);

  return (
    <Modal
      projectId={process.env.REACT_APP_WALLETCONNECT_PROJECT_ID}
      defaultChain={defaultChain}
      ethereumClient={ethereumClient}
      enableNetworkView={false}
      themeColor="teal"
      themeVariables={{
        "--w3m-color-fg-accent": "#FF0000 !important",
      }}
    />
  );
}
