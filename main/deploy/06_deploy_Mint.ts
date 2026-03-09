import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  handleGrantRole,
  handleRegistry,
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

  const mint = await deploy("Mint", {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [owner, authority.address, registry.address],
        },
      },
    },
    log: true,
  });

  await handleRegistry(ACLAdmin, deployments, "MINT", mint.address);

  await handleSetTargetFunctionRole(
    owner,
    deployments,
    "MINTER_ROLE",
    "Mint",
    ["mint"],
    mint.address
  );

  await handleGrantRole(
    owner,
    deployments,
    "DONATION_REGISTRATION_ROLE",
    mint.address
  );
};

export default func;

func.tags = ["Mint"];
