import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  handleRegistry,
  handleGrantRole,
  handleSetTargetFunctionRole,
} from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy, get } = deployments;

  const { deployer, owner, ACLAdmin } = await getNamedAccounts();

  const authority = await get("Authority");
  const registry = await get("Registry");
  const pool = await get("Pool");
  const vault = await get("Vault");

  const poolManager = await deploy("PoolManager", {
    from: deployer,
    args: [
      authority.address,
      owner,
      registry.address,
      pool.address,
      vault.address,
    ],
    log: true,
  });

  await handleRegistry(
    ACLAdmin,
    deployments,
    "POOL_MANAGER",
    poolManager.address
  );

  await handleGrantRole(
    owner,
    deployments,
    "MINTER_ADMIN_ROLE",
    poolManager.address
  );

  await handleGrantRole(
    owner,
    deployments,
    "POOL_REGISTRATION_ROLE",
    poolManager.address
  );

  await handleSetTargetFunctionRole(
    owner,
    deployments,
    "POOL_CREATION_ROLE",
    "PoolManager",
    ["deployPool"],
    poolManager.address
  );
};

export default func;

func.tags = ["PoolManager"];
