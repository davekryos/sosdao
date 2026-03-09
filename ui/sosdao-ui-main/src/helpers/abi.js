const ABIs = {
  ERC20: {
    abi: [
      "function allowance(address,address) view returns (uint256)",
      "function approve(address,uint256)",
      "function name() view returns (string memory)",
      "function symbol() view returns (string memory)",
      "function decimals() view returns (uint256)",
      "event Approval(address indexed owner, address indexed spender, uint256 value)",
    ],
  },
  REGISTRY: require("../abis/Registry.json"),
  FUND_MANAGER: require("../abis/FundManager.json"),
  FUNDV1: require("../abis/FundV1.json"),
  GOVERNOR: require("../abis/Governor.json"),
  SOS: require("../abis/SOS.json"),
  DONATION_STORAGE: require("../abis/DonationStorage.json"),
  DONATION: require("../abis/Donation.json"),
};

export function getABI(id) {
  return ABIs[id].abi;
}
