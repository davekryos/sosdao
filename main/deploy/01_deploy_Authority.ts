import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { handleGrantRole, handleSetRoleAdmin } from "../scripts";

export const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;

  const { deployer, owner, ACLAdmin } = await getNamedAccounts();

  await deploy("Authority", {
    from: deployer,
    args: [owner],
    log: true,
  });

  await handleSetRoleAdmin(
    owner,
    deployments,
    "MINTER_ROLE",
    "MINTER_ADMIN_ROLE"
  );

  await handleGrantRole(owner, deployments, "REGISTRATION_ROLE", ACLAdmin);
  await handleGrantRole(owner, deployments, "POOL_CREATION_ROLE", ACLAdmin);
};

export default func;

func.tags = ["Authority"];
