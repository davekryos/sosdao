import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { asBytes32, deployTestStack } from "../scripts/";

import {
  DonationRegisteredEvent,
  PoolRegisteredEvent,
} from "../typechain-types/contracts/platform/registry/Registry";

describe("Registry", function () {
  async function deploy() {
    return deployTestStack();
  }

  const names = ["FUND_MANAGER", "GOVERNOR"].map((value) => asBytes32(value));

  describe("UUPSUpgradeable", () => {
    it("should be upgradable only by authority EOA", async function () {
      const {
        contracts: { registry },
        accounts,
      } = await loadFixture(deploy);

      const RegistryImpl = await ethers.getContractFactory("RegistryV2");
      const registryV2 = await RegistryImpl.connect(accounts.deployer).deploy();

      const call = registry
        .connect(accounts.deployer)
        .upgradeToAndCall(
          registryV2.target as string,
          registryV2.interface.encodeFunctionData("initialize", ["ETH"])
        );

      expect(call).to.be.revertedWithCustomError(
        registry,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should be upgradable", async function () {
      const {
        contracts: { registry },
        accounts,
      } = await loadFixture(deploy);

      const RegistryImpl = await ethers.getContractFactory("RegistryV2");
      const registryV2 = await RegistryImpl.connect(accounts.deployer).deploy();

      await registry
        .connect(accounts.authority)
        .upgradeToAndCall(
          registryV2.target as string,
          registryV2.interface.encodeFunctionData("initialize", ["ETH"])
        );

      const symbol = await registry.NATIVE_ASSET_SYMBOL();

      expect(symbol).to.eql("ETH");
    });
  });

  describe("getPool / registerPool", () => {
    it("should get a pool", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses, POOL_ID },
      } = await loadFixture(deploy);

      const register = await registry
        .connect(role)
        .registerPool(POOL_ID, addresses[4], "Pool", "Pool Description");

      const result = await register.wait();

      const log = result!.logs[0] as PoolRegisteredEvent.Log;

      const pool = await registry.getPool(POOL_ID);

      expect(register).to.emit(registry, "PoolRegistered");
      expect(log.args[0]).to.be.eq(POOL_ID);
      expect(log.args[1]).to.be.hexEqual(addresses[4]);
      expect(log.args[2]).to.be.eql("Pool");
      expect(log.args[3]).to.be.eql("Pool Description");

      expect(pool).to.be.hexEqual(addresses[4]);
    });
  });

  describe("registerDonation / getDonation", () => {
    it("should register and get a donation", async function () {
      const {
        contracts: { registry },
        accounts: { role, donor },
        constants: { POOL_ID },
        functions: { deployPool },
      } = await loadFixture(deploy);

      await deployPool();

      const register = await registry.connect(role).registerDonation(1, {
        pool: POOL_ID,
        donor: donor,
        asset: ethers.ZeroAddress,
        amount: ethers.parseEther("0.1"),
      });

      const result = await register.wait();

      const log = result!.logs[0] as DonationRegisteredEvent.Log;

      const encoder = new ethers.AbiCoder();

      const donation = await registry.getDonation(
        ethers.keccak256(
          encoder.encode(["uint256", "address"], [1, role.address])
        )
      );

      expect(register).to.emit(registry, "DonationRegistered");
      expect(log.args[0]).to.be.eq(POOL_ID);
      expect(log.args[1]).to.be.hexEqual(donor.address);
      expect(log.args[2]).to.be.eql(ethers.ZeroAddress);
      expect(log.args[3]).to.be.eql(ethers.parseEther("0.1"));

      expect(donation.pool).to.be.eql(POOL_ID);
      expect(donation.donor).to.be.eql(donor.address);
      expect(donation.asset).to.be.eql(ethers.ZeroAddress);
      expect(donation.amount).to.be.eql(ethers.parseEther("0.1"));
    });
  });

  describe("register", () => {
    it("should register and return a registered address", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await Promise.all([
        registry.connect(role).register(names[0], addresses[0]),
        registry.connect(role).register(names[1], addresses[1]),
      ]);

      const address = await registry.get(names[0]);

      expect(address).to.be.hexEqual(addresses[0]);
    });
  });

  describe("update", () => {
    it("should update a registered address", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await registry.connect(role).register(names[0], addresses[0]);

      await registry.connect(role).update(names[0], addresses[1]);

      const address = await registry.get(names[0]);

      expect(address).to.be.hexEqual(addresses[1]);
    });
  });

  describe("batchRegister", () => {
    it("should be restricted", async function () {
      const {
        contracts: { registry },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = registry.batchRegister(names, addresses.slice(0, 2));

      await expect(call).to.be.revertedWithCustomError(
        registry,
        "AccessManagedUnauthorized"
      );
    });

    it("should register and return registered addresses", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await registry.connect(role).batchRegister(names, addresses.slice(0, 2));

      const response = await registry.batchGet(names);

      expect(response).to.be.eql(addresses.slice(0, 2));
    });
  });

  describe("batchUpdate", () => {
    it("should be restricted", async function () {
      const {
        contracts: { registry },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = registry.batchUpdate(names, addresses.slice(0, 2));

      await expect(call).to.be.revertedWithCustomError(
        registry,
        "AccessManagedUnauthorized"
      );
    });

    it("should update registered addresses", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await registry.connect(role).batchRegister(names, addresses.slice(0, 2));

      await registry.connect(role).batchUpdate(names, addresses.slice(-2));

      const response = await registry.batchGet(names);

      expect(response).to.be.eql(addresses.slice(-2));
    });
  });

  describe("batchGet", () => {
    it("should return the contract names in an address array", async function () {
      const {
        contracts: { registry },
        accounts: { role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await registry.connect(role).batchRegister(names, addresses.slice(0, 2));

      await registry.connect(role).batchUpdate(names, addresses.slice(-2));

      const response = await registry.batchGet(names);

      expect(response).to.be.eql(addresses.slice(-2));
    });
  });
});
