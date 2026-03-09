import { ethers } from "ethers";
import { getContract, getProvider, fetchSigner } from "@wagmi/core";

const { ethereum } = window;

export const createEthereumContract = async (
  address,
  jsonObject,
  isSigner = false,
  injectedProvider = null
) => {
  try {
    const provider = isSigner ? await fetchSigner() : getProvider();

    const contract = getContract({
      address,
      abi: jsonObject.abi,
      signerOrProvider: provider,
    });

    return contract;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
