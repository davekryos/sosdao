import { createEthereumContract } from "./contractCreator";

export const getERC20Contract = (
  address,
  isSigner = false,
  injectedProvider = null
) => {
  return createEthereumContract(
    address,
    {
      abi: [
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256)",
        "function name() view returns (string memory)",
        "function symbol() view returns (string memory)",
        "function decimals() view returns (uint256)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
      ],
    },
    isSigner,
    injectedProvider
  );
};
