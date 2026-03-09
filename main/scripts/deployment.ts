import { ethers } from "hardhat";

import { DeploymentsExtension } from "hardhat-deploy/types";

import { asBytes32, getRoleId } from "./misc";

// Access Control
export async function handleSetRoleAdmin(
  from: string,
  deployments: DeploymentsExtension,
  roleName: string,
  adminRoleName: string
) {
  const { read, execute } = deployments;

  const roleId = getRoleId(roleName);
  const adminRoleId = getRoleId(adminRoleName);

  const remoteAdminRoleId = await read("Authority", {}, "getRoleAdmin", roleId);

  if (remoteAdminRoleId.toBigInt() !== adminRoleId) {
    await execute(
      "Authority",
      { from, log: true },
      "setRoleAdmin",
      roleId,
      adminRoleId
    );
  } else {
    console.log(`skipping Authority.setRoleAdmin(${roleId}, ${adminRoleId})`);
  }
}

export async function handleGrantRole(
  from: string,
  deployments: DeploymentsExtension,
  roleName: string,
  roleAdmin: string,
  delay = BigInt.asUintN(32, 0n)
) {
  const { read, execute } = deployments;

  const roleId = getRoleId(roleName);

  const [hasRole, _delay] = await read(
    "Authority",
    {},
    "hasRole",
    roleId,
    roleAdmin
  );

  if (!hasRole) {
    await execute(
      "Authority",
      { from, log: true },
      "grantRole",
      roleId,
      roleAdmin,
      delay
    );
  } else {
    console.log(
      `skipping Authority.grantRole(${roleId}, ${roleAdmin}, ${delay})`
    );
  }
}

export async function handleSetTargetFunctionRole(
  from: string,
  deployments: DeploymentsExtension,
  roleName: string,
  targetContractName: string,
  selectors: string[],
  targetContractAddress: string
) {
  const { read, execute } = deployments;

  const artifact = await deployments.getArtifact(targetContractName);
  const contract = await ethers.getContractFactoryFromArtifact(artifact);

  const selectorsAsBytes = selectors.map(
    (name) => contract.interface.getFunction(name)!.selector
  );

  const roleId = getRoleId(roleName);

  const set = async (selector: string) => {
    const remoteRoleId = await read(
      "Authority",
      {},
      "getTargetFunctionRole",
      targetContractAddress,
      selector
    );

    if (remoteRoleId.toBigInt() !== roleId) {
      await execute(
        "Authority",
        { from, log: true },
        "setTargetFunctionRole",
        targetContractAddress,
        [selector],
        roleId
      );
    } else {
      console.log(
        `skipping Authority.setTargetFunctionRole(${targetContractAddress}, [${selector}], ${roleId})`
      );
    }
  };

  for await (const selector of selectorsAsBytes) {
    await set(selector);
  }
}

// Registry
export async function handleRegistry(
  deployer: string,
  deployments: DeploymentsExtension,
  contractName: string,
  deploymentAddress: string
): Promise<void> {
  const { read, execute } = deployments;
  try {
    const isRegistered = await read(
      "Registry",
      {},
      "get",
      asBytes32(contractName)
    );

    if (isRegistered && isRegistered == deploymentAddress) return;
    if (isRegistered && isRegistered != deploymentAddress) {
      await execute(
        "Registry",
        { from: deployer, log: true },
        "update",
        asBytes32(contractName),
        deploymentAddress
      );
      return;
    }
  } catch (_e) {
    await execute(
      "Registry",
      { from: deployer, log: true },
      "register",
      asBytes32(contractName),
      deploymentAddress
    );
  }
}
