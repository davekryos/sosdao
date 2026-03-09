import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { deployTestStack } from "../scripts";

describe("PoolManager.sol", function () {
  async function deploy() {
    return deployTestStack();
  }

  describe("Pausable (Open Zeppelin)", function () {
    it("should be pausable", async function () {
      const {
        contracts: { poolManager },
        accounts: { role },
      } = await loadFixture(deploy);

      let isPaused = await poolManager.paused();

      expect(isPaused).to.be.false;

      await poolManager.connect(role).pause();

      isPaused = await poolManager.paused();

      expect(isPaused).to.be.true;
    });

    it("should be unpausable", async function () {
      const {
        contracts: { poolManager },
        accounts: { role },
      } = await loadFixture(deploy);

      let isPaused = await poolManager.paused();

      expect(isPaused).to.be.false;

      await poolManager.connect(role).pause();

      isPaused = await poolManager.paused();

      expect(isPaused).to.be.true;

      await poolManager.connect(role).unpause();

      isPaused = await poolManager.paused();

      expect(isPaused).to.be.false;
    });
  });

  describe("deployPool", () => {
    it("should deploy a new pool", async function () {
      const {
        contracts: { poolManager },
        accounts: { role, owners },
      } = await loadFixture(deploy);

      const deployment = await poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: 2 },
      });

      await expect(deployment).not.to.be.reverted;

      const addressCount = await poolManager.getPoolAddressesCount();
      const idCount = await poolManager.getPoolIdsCount();

      expect(addressCount).to.be.eq(1);
      expect(idCount).to.be.eq(1);
    });

    it("should emit a PoolRegistered event", async function () {
      const {
        contracts: { poolManager, registry },
        accounts: { role, owners },
      } = await loadFixture(deploy);

      const deployment = poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: 2 },
      });

      await expect(deployment).to.emit(registry, "PoolRegistered");
    });

    it("should revert if a pool with the same name exists", async function () {
      const {
        contracts: { poolManager },
        accounts: { role, owners },
      } = await loadFixture(deploy);

      await poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: 2 },
      });

      const deployment = poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: 2 },
      });

      await expect(deployment).to.revertedWithCustomError(
        poolManager,
        "Exists"
      );
    });

    it("should revert if given incorrect multi sig. parameters (via Vault.sol)", async function () {
      const {
        contracts: { poolManager },
        accounts: { role, owners },
      } = await loadFixture(deploy);

      const deployment = poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: owners.length + 1 },
      });

      await expect(deployment).to.be.revertedWithCustomError(
        poolManager,
        "IncorrectThreshold"
      );
    });

    it("should return pools", async () => {
      const {
        contracts: { poolManager },
        accounts: { role, owners },
      } = await loadFixture(deploy);

      await poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: owners.length },
      });

      await poolManager.connect(role).deployPool({
        name: "Pool 2",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: owners.length },
      });

      const poolIds = await poolManager.getPoolIds();
      const poolAddresses = await poolManager.getPoolAddresses();

      const expectedIds = ["Pool", "Pool 2"].map((name) =>
        ethers.keccak256(
          new ethers.AbiCoder().encode(
            ["address", "uint256", "string"],
            [poolManager.target, 1, name]
          )
        )
      );

      expect(poolIds).to.have.length(2);
      expect(poolAddresses).to.have.length(2);
      expect(poolIds).to.eql(expectedIds);
    });
  });

  describe("Beacon", () => {
    it("should be upgradable only by owner", async function () {
      const {
        contracts: { poolManager },
        accounts: { deployer, role, owners },
      } = await loadFixture(deploy);

      await poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: owners.length },
      });

      const PoolImpl = await ethers.getContractFactory("PoolV2");

      const poolV2 = await PoolImpl.connect(deployer).deploy();

      const upgrade = poolManager.connect(deployer).upgradeTo(poolV2);

      expect(upgrade).to.be.reverted;
    });

    it("should be upgradable", async function () {
      const {
        contracts: { registry, poolManager },
        accounts: { authority, deployer, role, owners },
        constants: { POOL_ID },
      } = await loadFixture(deploy);

      await poolManager.connect(role).deployPool({
        name: "Pool",
        description: "Pool is a Pool",
        permittedAssets: [ethers.ZeroAddress],
        feeRatio: 0,
        vaultParameters: { owners, threshold: owners.length },
      });

      const poolAddress = await registry.getPool(POOL_ID);

      const pool = await ethers.getContractAt("Pool", poolAddress);

      const previousGetAddress = await pool.getVaultAddress();

      const PoolImpl = await ethers.getContractFactory("PoolV2");

      const poolV2 = await PoolImpl.connect(deployer).deploy();

      const upgrade = await poolManager.connect(authority).upgradeTo(poolV2);

      const getVaultAddress = await pool.getVaultAddress();

      expect(previousGetAddress).to.not.be.hexEqual(ethers.ZeroAddress);
      expect(getVaultAddress).to.be.hexEqual(ethers.ZeroAddress);
      expect(upgrade).to.not.be.reverted;
    });
  });
});
