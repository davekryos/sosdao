import { BaseContract, ContractFactory, Signer } from "ethers";
import { BigNumberish } from "ethers";

import { TypedContractMethod } from "../typechain-types/common";
import { Authority } from "../typechain-types";

import { getRoleId } from ".";

export async function setRoleAdmin(
  authority: Authority,
  roleName: string,
  adminRoleName: string
) {
  const [roleId, adminRoleId] = [getRoleId(roleName), getRoleId(adminRoleName)];
  return authority.setRoleAdmin(roleId, adminRoleId);
}

export function getFunctionSignatures<T extends BaseContract>(
  contract: T | ContractFactory,
  names: Array<TypedContractMethod["name"]>
) {
  return names.map((name) => contract.interface.getFunction(name)!.selector);
}

export async function grantRole(
  authority: Authority,
  roleName: string,
  roleAccount: Signer | BaseContract
) {
  const roleId = getRoleId(roleName);

  await Promise.all([
    authority.labelRole(roleId, roleName),
    authority.grantRole(roleId, roleAccount, 0),
  ]);

  return { roleId };
}

export async function setupProtectedFunctions<T extends BaseContract>(
  authority: Authority,
  contract: T,
  names: string[],
  roleId: BigNumberish
) {
  const fragments = getFunctionSignatures(contract, names);

  await authority.setTargetFunctionRole(contract, fragments, roleId);

  return { roleId, fragments };
}
