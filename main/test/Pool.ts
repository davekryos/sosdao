import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { deployTestStack } from "../scripts";

describe("Pool.sol", function () {
  async function deploy(feeRatio = 2000, threshold = 2) {
    const { functions, contracts, accounts, constants, factories } =
      await deployTestStack();

    const initialize = contracts.poolImplementation.initialize.bind(
      null,
      contracts.registry,
      1,
      constants.POOL_ID,
      contracts.vaultImplementation,
      {
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress, contracts.erc20.target],
        feeRatio,
        vaultParameters: { owners: accounts.owners, threshold },
      }
    );

    return {
      contracts,
      accounts,
      constants,
      factories,
      functions: { ...functions, initialize },
    };
  }

  describe("initialize", () => {
    it("should not allow subsequent calls", async function () {
      const {
        contracts: { poolImplementation },
        functions: { initialize, deployPool },
      } = await loadFixture(deploy);

      await deployPool();

      await expect(initialize()).to.be.revertedWithCustomError(
        poolImplementation,
        "InvalidInitialization"
      );
    });
  });

  describe("initialize (vault deployment)", function () {
    it("should not allow a threshold of 0 (via Vault.sol)", async function () {
      const {
        functions: { deployPool },
        factories: { vault },
      } = await loadFixture(deploy);

      const call = deployPool.bind(null, 2000, 0);

      await expect(call()).to.be.revertedWithCustomError(
        vault,
        "IncorrectThreshold"
      );
    });

    it("should not allow a threshold greater than the number of signatories (via Vault.sol)", async function () {
      const {
        functions: { deployPool },
        factories: { vault },
      } = await loadFixture(deploy);

      const call = deployPool.bind(null, 2000, 6);

      await expect(call()).to.be.revertedWithCustomError(
        vault,
        "IncorrectThreshold"
      );
    });

    it("deploy a vault", async function () {
      const {
        functions: { deployPool },
        accounts: { owners },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      const vaultAddress = await pool.getVaultAddress();
      const vault = await ethers.getContractAt("Vault", vaultAddress);

      const checkOwners = await vault.getOwners();

      const addresses = await Promise.all(
        owners.map((owner: Signer) => owner.getAddress())
      );

      const checkThreshold = await vault.getThreshold();

      expect(checkOwners).to.be.eql(addresses);
      expect(checkThreshold).to.be.eq(2);
    });

    it("should emit a VaultDeployed event", async function () {
      const {
        functions: { deployPool },
      } = await loadFixture(deploy);

      const [pool, tx] = await deployPool();

      await expect(tx)
        .to.emit(pool, "VaultDeployed")
        .withArgs(anyValue, pool.target);
    });
  });

  describe("getVault", function () {
    it("should return the address for the underlying vault", async function () {
      const {
        functions: { deployPool },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      const vault = await pool.getVaultAddress();

      expect(vault).to.be.a.properAddress;
    });
  });

  describe("depositNative", function () {
    it("should allow deposit of native asset", async function () {
      const {
        functions: { deployPool },
        contracts: { mint },
        accounts: { donor },
        constants: { AMOUNT },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      const address = await donor.getAddress();

      const previousBalance = await pool.getNativeBalance();

      expect(previousBalance).to.eq(0);

      const deposit = await pool
        .connect(donor)
        .depositNative({ value: AMOUNT });

      const [balance, balanceOf] = await Promise.all([
        pool.getNativeBalance(),
        pool.getNativeBalanceOf(address),
      ]);

      expect(balance).to.eq(AMOUNT);

      expect(balanceOf).to.eql(AMOUNT);

      await expect(deposit).to.emit(mint, "Transfer");
    });
  });

  describe("depositERC20", function () {
    it("should allow deposit of ERC20 assets", async function () {
      const {
        contracts: { erc20, mint },
        functions: { deployPool },
        accounts: { donor },
        constants: { AMOUNT },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();
      const vault = await pool.getVaultAddress();

      await erc20.connect(donor).approve(vault, AMOUNT);

      const address = await donor.getAddress();

      const [previousBalance, previousBalanceOf] = await Promise.all([
        pool.getERC20Balance(erc20.target),
        pool.getERC20BalanceOf(erc20.target, address),
      ]);

      expect(previousBalance).to.eq(0);
      expect(previousBalanceOf).to.eq(0);

      const deposit = await pool
        .connect(donor)
        .depositERC20(erc20.target, AMOUNT);

      const [balance, balanceOf] = await Promise.all([
        pool.getERC20Balance(erc20.target),
        pool.getERC20BalanceOf(erc20.target, address),
      ]);

      expect(balance).to.eq(AMOUNT);

      expect(balanceOf).to.eql(AMOUNT);

      await expect(deposit).to.emit(mint, "Transfer");
    });

    it("should allow deposit of ERC20 assets with permit", async function () {
      const {
        contracts: { erc20WithPermit },
        functions: { deployPool },
        accounts: { donor },
        constants: { AMOUNT },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();
      const vault = await pool.getVaultAddress();

      const address = await donor.getAddress();

      const [previousBalance, previousBalanceOf] = await Promise.all([
        pool.getERC20Balance(erc20WithPermit.target),
        pool.getERC20BalanceOf(erc20WithPermit.target, address),
      ]);

      expect(previousBalance).to.eq(0);
      expect(previousBalanceOf).to.eq(0);

      const deadline = Math.floor(Date.now() / 1000) + 4200;
      const chainID = 31337;

      const nonces = await erc20WithPermit.nonces(address);

      const domain = {
        name: await erc20WithPermit.name(),
        version: "1",
        chainId: chainID,
        verifyingContract: erc20WithPermit.target as string,
      };

      const types = {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      };

      const values = {
        owner: address,
        spender: vault,
        value: AMOUNT,
        nonce: nonces,
        deadline,
      };

      const signature = await donor.signTypedData(domain, types, values);

      let splitSignature = ethers.Signature.from(signature);

      await pool
        .connect(donor)
        .depositERC20WithPermit(
          erc20WithPermit.target,
          AMOUNT,
          deadline,
          splitSignature.v,
          splitSignature.r,
          splitSignature.s
        );

      const [balance, balanceOf] = await Promise.all([
        pool.getERC20Balance(erc20WithPermit.target),
        pool.getERC20BalanceOf(erc20WithPermit.target, address),
      ]);

      expect(balance).to.eq(AMOUNT);
      expect(balanceOf).to.eql(AMOUNT);
    });
  });
});
