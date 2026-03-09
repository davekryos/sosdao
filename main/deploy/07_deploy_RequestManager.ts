import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { handleRegistry } from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy, get } = deployments;

  const { deployer, owner, ACLAdmin } = await getNamedAccounts();

  const registry = await get("Registry");

  const requestManager = await deploy("RequestManager", {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [owner, registry.address],
        },
      },
    },
    log: true,
  });

  await handleRegistry(
    ACLAdmin,
    deployments,
    "REQUEST_MANAGER",
    requestManager.address
  );
};

export default func;

func.tags = ["RequestManager"];
