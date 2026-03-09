import { createEthereumContract } from "../helpers/contractCreator";

const INTERFACES = {
  REGISTRY: (address) => ({
    Registry: createEthereumContract(address, require("../abis/Registry.json")),
  }),
  FUND_MANAGER: (address) => ({
    FundManager: createEthereumContract(
      address,
      require("../abis/FundManager.json"),
      true
    ),
  }),
  FUNDV1: (address) => ({
    FundV1: createEthereumContract(address, require("../abis/FundV1.json")),
  }),
  GOVERNOR: (address) => ({
    Governor: createEthereumContract(
      address,
      require("../abis/Governor.json"),
      true
    ),
  }),
  SOS: (address) => ({
    SOS: createEthereumContract(address, require("../abis/SOS.json")),
  }),
  DONATION_STORAGE: (address) => ({
    DonationStorage: createEthereumContract(
      address,
      require("../abis/DonationStorage.json"),
      false
    ),
  }),
  DONATION: (address) => ({
    Donation: createEthereumContract(
      address,
      require("../abis/Donation.json"),
      true
    ),
  }),
};

export default INTERFACES;
