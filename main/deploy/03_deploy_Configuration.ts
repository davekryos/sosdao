import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { handleRegistry } from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy, get } = deployments;

  const { deployer, ACLAdmin } = await getNamedAccounts();

  const authority = await get("Authority");
  const registry = await get("Registry");

  const configuration = await deploy("Configuration", {
    from: deployer,
    args: [authority.address, registry.address],
    log: true,
  });

  await handleRegistry(ACLAdmin, deployments, "AUTHORITY", authority.address);
  await handleRegistry(
    ACLAdmin,
    deployments,
    "CONFIGURATION",
    configuration.address
  );
};

export default func;

func.tags = ["Configuration"];
