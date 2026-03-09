import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";

import "hardhat-deploy";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  namedAccounts: {
    deployer: 2,
    owner: 0,
    ACLAdmin: 1,
  },
  networks: {
    sos: {
      url: process.env.SOS_NODE || "",
      chainId: parseInt(process.env.SOS_CHAIN_ID!),
      accounts: {
        mnemonic: process.env.SOS_MNEMONIC || "",
      },
      verify: {
        etherscan: {
          apiUrl: "https://explorer.sos.network/",
          apiKey: "",
        },
      },
    },
    sos_test: {
      url: process.env.SOS_TEST_NODE || "",
      chainId: parseInt(process.env.SOS_TEST_CHAIN_ID!),
      accounts: {
        mnemonic: process.env.SOS_TEST_MNEMONIC || "",
      },
      verify: {
        etherscan: {
          apiUrl: "https://explorer.testedge2.sos.network/",
          apiKey: "",
        },
      },
    },
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true,
  },
};

export default config;
