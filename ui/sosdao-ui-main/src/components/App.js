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

const haqqTestEdge2 = {
  id: 54211,
  name: "SOS DAO Testnet",
  network: "haqqTestEdge2",
  nativeCurrency: {
    decimals: 18,
    name: "SOS DAO Testnet",
    symbol: "SOST",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.eth.testedge2.haqq.network"],
    },
    public: {
      http: ["https://rpc.eth.testedge2.haqq.network"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "explorer",
      url: "https://explorer.testedge2.haqq.network",
    },
    default: {
      name: "explorer",
      url: "https://explorer.testedge2.haqq.network",
    },
  },
  testnet: true,
};

const chains = [haqqTestEdge2, avalanche, avalancheFuji, mainnet];

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
      <Web3Modal client={client} chains={chains} defaultChain={haqqTestEdge2} />
    </>
  );
};

export default App;
