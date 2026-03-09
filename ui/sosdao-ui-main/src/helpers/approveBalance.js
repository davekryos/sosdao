import { getERC20Contract } from "./getERC20Contract";
import { enterTX, exitTX, listenForApproval, notify } from "../redux/actions";
import { fetchSigner, getContract } from "@wagmi/core";

const abi = [
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256)",
  "function name() view returns (string memory)",
  "function symbol() view returns (string memory)",
  "function decimals() view returns (uint256)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export const approveBalance = async (
  tokenAddress,
  donationAddress,
  amount,
  dispatch
) => {
  try {
    const ERC20 = getContract({ address: tokenAddress, abi });

    dispatch(enterTX("Approve"));
    dispatch(listenForApproval(tokenAddress, amount));

    const tx = await ERC20.connect(await fetchSigner()).approve(
      donationAddress,
      amount
    );
    console.log(tx);
  } catch (error) {
    dispatch(notify("error", "Error", error.message));
    dispatch(exitTX());
  }
};
