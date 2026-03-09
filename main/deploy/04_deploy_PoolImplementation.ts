import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { handleRegistry } from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;

  const { deployer, ACLAdmin } = await getNamedAccounts();

  const pool = await deploy("Pool", {
    from: deployer,
    args: [],
    log: true,
  });

  await handleRegistry(
    ACLAdmin,
    deployments,
    "POOL_IMPLEMENTATION",
    pool.address
  );

  const vault = await deploy("Vault", {
    from: deployer,
    args: [],
    log: true,
  });

  await handleRegistry(
    ACLAdmin,
    deployments,
    "VAULT_IMPLEMENTATION",
    vault.address
  );
};

export default func;

func.tags = ["Pool"];
