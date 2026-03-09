import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { NATIVE_ASSETS, handleSetTargetFunctionRole } from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, network } = hre;

  const { deploy, get } = deployments;

  const { deployer, owner } = await getNamedAccounts();

  const authority = await get("Authority");

  const symbol = NATIVE_ASSETS[network.name as keyof typeof NATIVE_ASSETS];

  const registry = await deploy("Registry", {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [authority.address, owner, symbol],
        },
      },
    },
    log: true,
  });

  await handleSetTargetFunctionRole(
    owner,
    deployments,
    "REGISTRATION_ROLE",
    "Registry",
    ["register", "update", "batchRegister", "batchUpdate"],
    registry.address
  );

  await handleSetTargetFunctionRole(
    owner,
    deployments,
    "POOL_REGISTRATION_ROLE",
    "Registry",
    ["registerPool"],
    registry.address
  );

  await handleSetTargetFunctionRole(
    owner,
    deployments,
    "DONATION_REGISTRATION_ROLE",
    "Registry",
    ["registerDonation"],
    registry.address
  );
};

export default func;

func.tags = ["Registry"];
