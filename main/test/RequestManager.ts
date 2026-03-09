import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { deployTestStack } from "../scripts";

describe("RequestManager.sol", function () {
  async function deploy() {
    const { accounts, functions, ...rest } = await deployTestStack();

    return { accounts, functions, ...rest };
  }

  describe("create", () => {
    it("should create a new request", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { recipient, donor, others },
        constants: { AMOUNT, POOL_ID },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      await pool.connect(donor).depositNative({ value: AMOUNT * 2n });

      const create = await requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          AMOUNT
        );

      expect(create).not.to.be.reverted;
    });

    it("should not create a new request with amount 0", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { recipient, donor, others },
        constants: { POOL_ID, AMOUNT },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      await pool.connect(donor).depositNative({ value: AMOUNT * 2n });

      const create = requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          0
        );

      expect(create).to.be.reverted;
    });

    it("should not create a new request with amount greater than pool balance", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { recipient, donor, others },
        constants: { POOL_ID, AMOUNT },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      await pool.connect(donor).depositNative({ value: AMOUNT * 2n });

      const create = requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          1000
        );

      expect(create).to.be.reverted;
    });

    it("should create a new request", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { recipient, donor, others },
        constants: { AMOUNT, POOL_ID },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      await pool.connect(donor).depositNative({ value: AMOUNT * 2n });

      const create = await requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          AMOUNT
        );

      const requests = await requestManager.getRequestsByPool(POOL_ID);
      const requestsByPoolId = await requestManager.getRequestsByPool(POOL_ID);
      const requestsByAddress = await requestManager.getRequestsByAddress(
        recipient
      );

      expect(requests).to.have.length(1);
      expect(requestsByPoolId).to.eql([0n]);
      expect(requestsByAddress).to.eql([0n]);

      expect(create).not.to.be.reverted;
    });
  });

  describe("approve", () => {
    it("should approve a request", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { owners, donor, recipient, others },
        constants: { AMOUNT, POOL_ID },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      const vaultAddress = await pool.getVaultAddress();
      const vault = await ethers.getContractAt("Vault", vaultAddress);

      await pool.connect(donor).depositNative({ value: AMOUNT * 2n });

      const create = await requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          AMOUNT
        );

      await create.wait();

      const approve = await requestManager
        .connect(owners[0])
        .approve(POOL_ID, 0);

      await approve.wait();

      const hasSigned = await vault.connect(owners[0]).hasSigned(0, owners[0]);

      expect(approve).not.to.be.reverted;
      expect(hasSigned).to.be.true;
    });
  });

  describe("execute", () => {
    it("should execute a request", async function () {
      const {
        contracts: { requestManager },
        functions: { deployPool },
        accounts: { deployer, owners, recipient, others },
        constants: { AMOUNT, POOL_ID },
      } = await loadFixture(deploy);

      const [pool] = await deployPool();

      const vaultAddress = await pool.getVaultAddress();

      await deployer.sendTransaction({
        to: vaultAddress,
        value: ethers.parseEther("1000"),
      });

      const create = await requestManager
        .connect(others[0])
        .create(
          POOL_ID,
          recipient,
          "This is a request.",
          ethers.ZeroAddress,
          AMOUNT
        );

      await create.wait();

      const firstApproval = await requestManager
        .connect(owners[0])
        .approve(POOL_ID, 0);

      const secondApproval = await requestManager
        .connect(owners[1])
        .approve(POOL_ID, 0);

      await firstApproval.wait();

      await secondApproval.wait();

      const execute = await requestManager
        .connect(owners[0])
        .execute(POOL_ID, 0);

      expect(execute).not.to.be.reverted;
    });
  });
});
