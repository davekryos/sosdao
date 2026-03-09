import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { times } from "ramda";

export function createRandomAddress(n = 1) {
  if (n == 1) return Wallet.createRandom().address;

  return times((_n: number) => Wallet.createRandom().address, n);
}

export function getRoleId(roleName: string) {
  const id = ethers.id(roleName);
  const uint = ethers.getUint(id);

  return BigInt.asUintN(64, uint);
}

export function asBytes32(str: string) {
  return ethers.encodeBytes32String(str);
}
