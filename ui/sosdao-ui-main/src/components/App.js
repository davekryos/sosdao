import React from "react";

import { configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { avalanche, avalancheFuji, mainnet } from "wagmi/chains";

import { modalConnectors } from "@web3modal/ethereum";

import { getRPCProvider } from "../helpers/providers";

import NotificationContainer from "../common/react-notifications/NotificationContainer";
import Router from "./Router";
import Web3Modal from "./modals/web3Modal";

const sosTestnet = {
  id: 54211,
  name: "SOS DAO Testnet",
  network: "sosTestnet",
  nativeCurrency: {
    decimals: 18,
    name: "SOS DAO Testnet",
    symbol: "SOST",
  },
  rpcUrls: {
    default: {
      http: [process.env.REACT_APP_SOS_TEST_NODE || ""],
    },
    public: {
      http: [process.env.REACT_APP_SOS_TEST_NODE || ""],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "explorer",
      url: process.env.REACT_APP_SOS_TEST_EXPLORER_URL || "",
    },
    default: {
      name: "explorer",
      url: process.env.REACT_APP_SOS_TEST_EXPLORER_URL || "",
    },
  },
  testnet: true,
};

const chains = [sosTestnet, avalanche, avalancheFuji, mainnet];

const { provider } = configureChains(chains, [
  publicProvider(),
  jsonRpcProvider({
    rpc: (chain) => ({
      http: getRPCProvider(chain.id),
    }),
  }),
]);

const client = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
    version: "2", // or "2"
    appName: "web3Modal",
    chains,
  }),
  provider,
});

const App = () => {
  return (
    <>
      <WagmiConfig client={client}>
        <>
          <NotificationContainer />
          <Router />
        </>
      </WagmiConfig>
      <Web3Modal client={client} chains={chains} defaultChain={sosTestnet} />
    </>
  );
};

export default App;
