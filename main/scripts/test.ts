import { ethers } from "hardhat";
import { BigNumberish, Signer } from "ethers";
import {
  grantRole,
  setRoleAdmin,
  setupProtectedFunctions,
} from "./access-control";

import { Authority, Pool, Registry, Vault } from "../typechain-types";
import { asBytes32, createRandomAddress } from "./misc";

export async function deployRegistryContract(deployer: Signer) {
  const Registry = await ethers.getContractFactory("Registry");

  return Registry.connect(deployer).deploy();
}

export async function deployAuthorityContract(
  deployer: Signer,
  initialAuthority: Signer
) {
  const Authority = await ethers.getContractFactory("Authority");

  return Authority.connect(deployer).deploy(initialAuthority);
}

export async function deployPoolImplementationContract(deployer: Signer) {
  const PoolImpl = await ethers.getContractFactory("Pool");

  return PoolImpl.connect(deployer).deploy();
}

export async function deployPoolManagerContract(
  deployer: Signer,
  authorityContract: Authority,
  authorityAccount: Signer,
  registryContract: Registry,
  poolImplementationContract: Pool,
  vaultImplementationContract: Vault
) {
  const PoolManager = await ethers.getContractFactory("PoolManager");

  return PoolManager.connect(deployer).deploy(
    authorityContract,
    authorityAccount,
    registryContract,
    poolImplementationContract,
    vaultImplementationContract
  );
}

export async function deployRequestManagerContract(deployer: Signer) {
  const RequestManager = await ethers.getContractFactory("RequestManager");

  return RequestManager.connect(deployer).deploy();
}

export async function deployConfigurationContract(
  deployer: Signer,
  authorityContract: Authority,
  registryContract: Registry
) {
  const Configuration = await ethers.getContractFactory("Configuration");
  return Configuration.connect(deployer).deploy(
    authorityContract,
    registryContract
  );
}

export async function deployERC20Contract(
  deployer: Signer,
  name: string,
  symbol: string,
  amount: BigNumberish
) {
  const ERC20Variant = await ethers.getContractFactory("BasicERC20");

  return ERC20Variant.connect(deployer).deploy(name, symbol, amount);
}

export async function deployERC20WithPermitContract(
  deployer: Signer,
  name: string,
  symbol: string,
  amount: BigNumberish
) {
  const ERC20Variant = await ethers.getContractFactory("BasicERC20WithPermit");

  return ERC20Variant.connect(deployer).deploy(name, symbol, amount);
}

export async function deployTestStack() {
  const [ERC721_NAME, ERC721_SYMBOL] = ["SOS DAO", "SOSDNT"];
  const [ERC20_NAME, ERC20_SYMBOL] = ["Basic ERC20", "BERC20"];

  const NATIVE_ASSET_SYMBOL = "SOST";

  const DECIMAL_AMOUNT = "22.12000";

  const AMOUNT = ethers.parseUnits(DECIMAL_AMOUNT);

  const [
    deployer,
    authorityAccount,
    roleAccount,
    donorAccount,
    minterAccount,
    recipient,
    ...rest
  ] = await ethers.getSigners();

  const owners = rest.slice(0, 3);
  const others = rest.slice(3);

  const authority = await deployAuthorityContract(deployer, authorityAccount);

  const registryImplementation = await deployRegistryContract(deployer);

  const RegistryProxy = await ethers.getContractFactory("UUPSProxy");

  const registryProxy = await RegistryProxy.connect(deployer).deploy(
    registryImplementation,
    registryImplementation.interface.encodeFunctionData("initialize", [
      authority.target,
      authorityAccount.address,
      NATIVE_ASSET_SYMBOL,
    ])
  );

  const registry = await ethers.getContractAt("Registry", registryProxy.target);

  const configuration = await deployConfigurationContract(
    deployer,
    authority,
    registry
  );

  const poolImplementation = await deployPoolImplementationContract(deployer);

  const VaultImplementation = await ethers.getContractFactory("Vault");
  const vaultImplementation = await VaultImplementation.deploy();

  const poolManager = await deployPoolManagerContract(
    deployer,
    authority,
    authorityAccount,
    registry,
    poolImplementation,
    vaultImplementation
  );

  const POOL_ID = ethers.keccak256(
    new ethers.AbiCoder().encode(
      ["address", "uint256", "string"],
      [poolManager.target, 1, "Pool"]
    )
  );

  const requestManagerImplementation = await deployRequestManagerContract(
    deployer
  );

  const RequestManagerProxy = await ethers.getContractFactory("UUPSProxy");

  const requestManagerProxy = await RequestManagerProxy.connect(
    deployer
  ).deploy(
    requestManagerImplementation,
    requestManagerImplementation.interface.encodeFunctionData("initialize", [
      authorityAccount.address,
      registry.target,
    ])
  );

  const requestManager = await ethers.getContractAt(
    "RequestManager",
    requestManagerProxy.target
  );

  const erc20 = await deployERC20Contract(
    donorAccount,
    ERC20_NAME,
    ERC20_SYMBOL,
    AMOUNT
  );

  const erc20WithPermit = await deployERC20WithPermitContract(
    donorAccount,
    ERC20_NAME,
    ERC20_SYMBOL,
    AMOUNT
  );

  const Registered = await ethers.getContractFactory("IsRegistered");
  const registered = await Registered.deploy(registry);

  const MintImplementation = await ethers.getContractFactory("Mint");
  const mintImplementation = await MintImplementation.deploy();

  const MintProxy = await ethers.getContractFactory("UUPSProxy");

  const mintProxy = await MintProxy.connect(deployer).deploy(
    mintImplementation,
    mintImplementation.interface.encodeFunctionData("initialize", [
      authorityAccount.address,
      authority.target,
      registry.target,
    ])
  );

  const mint = await ethers.getContractAt("Mint", mintProxy.target);

  const { roleId: creationRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "POOL_CREATION_ROLE",
    roleAccount
  );

  const { roleId: registrationRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "REGISTRATION_ROLE",
    roleAccount
  );

  const { roleId: managerRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "MANAGER_ROLE",
    roleAccount
  );

  const { roleId: configurationRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "CONFIGURATION_ROLE",
    roleAccount
  );

  const { roleId: minterRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "MINTER_ROLE",
    minterAccount
  );

  await setRoleAdmin(
    authority.connect(authorityAccount),
    "MINTER_ROLE",
    "MINTER_ADMIN_ROLE"
  );

  await grantRole(
    authority.connect(authorityAccount),
    "MINTER_ADMIN_ROLE",
    poolManager
  );

  const { roleId: poolRegistrationRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "POOL_REGISTRATION_ROLE",
    poolManager
  );

  await grantRole(
    authority.connect(authorityAccount),
    "POOL_REGISTRATION_ROLE",
    roleAccount
  );

  const { roleId: donationRegistrationRoleId } = await grantRole(
    authority.connect(authorityAccount),
    "DONATION_REGISTRATION_ROLE",
    mint
  );

  await grantRole(
    authority.connect(authorityAccount),
    "DONATION_REGISTRATION_ROLE",
    roleAccount
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    configuration,
    ["addFeeTaker", "removeFeeTaker"],
    configurationRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    poolManager,
    ["deployPool"],
    creationRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    poolManager,
    ["pause", "unpause"],
    managerRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    registry,
    ["register", "update", "batchRegister", "batchUpdate"],
    registrationRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    registry,
    ["registerPool"],
    poolRegistrationRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    registry,
    ["registerDonation"],
    donationRegistrationRoleId
  );

  await setupProtectedFunctions(
    authority.connect(authorityAccount),
    mint,
    ["mint"],
    minterRoleId
  );

  const deployPool = async (feeRatio = 2000, threshold = 2) => {
    const tx = await poolManager.connect(roleAccount).deployPool({
      name: "Pool",
      description: "Pool is a Pool",
      permittedAssets: [
        ethers.ZeroAddress,
        erc20.target,
        erc20WithPermit.target,
      ],
      feeRatio,
      vaultParameters: { owners, threshold },
    });

    const receipt = await tx.wait();

    const poolAddress = await registry.getPool(POOL_ID);
    const pool = await ethers.getContractAt("Pool", poolAddress);

    return [pool, tx, receipt] as [typeof pool, typeof tx, typeof receipt];
  };

  await registry
    .connect(roleAccount)
    .register(asBytes32("CONFIGURATION"), configuration);

  await registry
    .connect(roleAccount)
    .register(asBytes32("REQUEST_MANAGER"), requestManager);

  await registry.connect(roleAccount).register(asBytes32("MINT"), mint);

  return {
    functions: {
      deployPool,
    },
    contracts: {
      authority,
      registry,
      registered,
      requestManager,
      configuration,
      poolImplementation,
      vaultImplementation,
      poolManager,
      mint,
      erc20,
      erc20WithPermit,
    },
    factories: {
      vault: await ethers.getContractFactory("Vault"),
    },
    accounts: {
      authority: authorityAccount,
      deployer,
      donor: donorAccount,
      recipient,
      role: roleAccount,
      owners,
      minter: minterAccount,
      others,
    },
    constants: {
      addresses: createRandomAddress(5) as string[],
      ERC20_NAME,
      ERC20_SYMBOL,
      ERC721_NAME,
      ERC721_SYMBOL,
      DECIMAL_AMOUNT,
      NATIVE_ASSET_SYMBOL,
      POOL_ID,
      AMOUNT,
    },
  };
}
