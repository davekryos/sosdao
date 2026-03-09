import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { TXSubmittedEvent } from "../typechain-types/contracts/Vault";

import { deployTestStack } from "../scripts";

describe("Vault.sol", function () {
  async function deploy(threshold = 2) {
    const { contracts, accounts, functions, constants } =
      await deployTestStack();

    const VaultImplementation = await ethers.getContractFactory("Vault");
    const vaultImplementation = await VaultImplementation.deploy();

    const VaultProxy = await ethers.getContractFactory("UUPSProxy");

    const vaultProxy = await VaultProxy.connect(accounts.deployer).deploy(
      vaultImplementation,
      vaultImplementation.interface.encodeFunctionData("initialize", [
        accounts.deployer.address, // as Pool
        {
          owners: accounts.owners.map((owner) => owner.address),
          threshold: threshold,
        },
      ])
    );

    const vault = await ethers.getContractAt("Vault", vaultProxy.target);

    await contracts.erc20
      .connect(accounts.donor)
      .transfer(vault, ethers.parseEther("20"));

    await contracts.erc20WithPermit
      .connect(accounts.donor)
      .transfer(vault, ethers.parseEther("20"));

    await accounts.deployer.sendTransaction({
      to: vault.target,
      value: ethers.parseEther("1000"),
    });

    return {
      contracts: { ...contracts, vault },
      accounts,
      functions,
      constants,
    };
  }

  describe("UUPSUpgradeable", () => {
    it("should set an upgrade target only by owners", async function () {
      const {
        contracts: { vault },
        accounts: { deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      const call = vault.connect(deployer).setUpgradeTarget(vaultV2.target);

      expect(call).to.be.revertedWithCustomError(vault, "NotOwner");
    });

    it("should not set an upgrade target for address zero", async function () {
      const {
        contracts: { vault },
        accounts: { owners },
      } = await loadFixture(deploy);

      const call = vault
        .connect(owners[1])
        .setUpgradeTarget(ethers.ZeroAddress);

      expect(call).to.be.revertedWithCustomError(
        vault,
        "UpgradeTargetMismatch"
      );
    });

    it("should clear previous signatures when upgrade target is set", async function () {
      const {
        contracts: { vault, erc20 },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(erc20.target);
      await vault.connect(owners[0]).approveUpgradeTarget(erc20.target);

      const preSigned = await vault.hasApprovedUpgrade(owners[0].address);
      expect(preSigned).to.be.true;

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      const postSigned = await vault.hasApprovedUpgrade(owners[0].address);
      expect(postSigned).to.be.false;
    });

    it("should not approve upgrade unless an upgrade target is set", async function () {
      const {
        contracts: { vault },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      const call = vault
        .connect(owners[0])
        .approveUpgradeTarget(vaultV2.target);

      expect(call).to.be.revertedWithCustomError(
        vault,
        "UpgradeTargetMismatch"
      );
    });

    it("should not approve upgrade for an address other than the upgrade target", async function () {
      const {
        contracts: { vault, erc20 },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      const call = vault.connect(owners[0]).approveUpgradeTarget(erc20.target);

      expect(call).to.be.revertedWithCustomError(
        vault,
        "UpgradeTargetMismatch"
      );
    });

    it("should not approve upgrade if not owner", async function () {
      const {
        contracts: { vault, erc20 },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      const call = vault.connect(deployer).approveUpgradeTarget(erc20.target);

      expect(call).to.be.revertedWithCustomError(vault, "NotOwner");
    });

    it("should not approve upgrade if already signed", async function () {
      const {
        contracts: { vault },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      await vault.connect(owners[0]).approveUpgradeTarget(vaultV2.target);

      const call = vault
        .connect(owners[0])
        .approveUpgradeTarget(vaultV2.target);

      expect(call).to.be.revertedWithCustomError(vault, "AlreadySigned");
    });

    it("should not be upgradeable unless target is approved", async function () {
      const {
        contracts: { vault },
        accounts: { owners, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      await vault.connect(owners[0]).approveUpgradeTarget(vaultV2.target);

      await vault.connect(owners[1]).approveUpgradeTarget(vaultV2.target);

      const call = vault
        .connect(owners[1])
        .upgradeToAndCall(
          vaultV2.target as string,
          vaultV2.interface.encodeFunctionData("initialize", [23292n])
        );

      expect(call).to.be.revertedWithCustomError(vault, "UpgradeNotApproved");
    });

    it("should be upgradable only by owners", async function () {
      const {
        contracts: { vault },
        accounts: { authority, deployer },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      const call = vault
        .connect(authority)
        .upgradeToAndCall(
          vaultV2.target as string,
          vaultV2.interface.encodeFunctionData("initialize", [23292n])
        );

      expect(call).to.be.revertedWithCustomError(vault, "NotOwner");
    });

    it("should be upgradable", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      await vault.connect(owners[0]).approveUpgradeTarget(vaultV2.target);

      await vault.connect(owners[1]).approveUpgradeTarget(vaultV2.target);

      await vault.connect(owners[2]).approveUpgradeTarget(vaultV2.target);

      const signatures = await vault.getUpgradeSignatures();

      expect(signatures).to.have.length(3);

      await vault
        .connect(owners[0])
        .upgradeToAndCall(
          vaultV2.target as string,
          vaultV2.interface.encodeFunctionData("initialize", [23292n])
        );

      const balance = await vault.getNativeBalance();

      expect(balance).to.eql(23292n);
    });

    it("should clear target and signatures after upgrade", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners },
      } = await loadFixture(deploy);

      const VaultImpl = await ethers.getContractFactory("VaultV2");
      const vaultV2 = await VaultImpl.connect(deployer).deploy();

      await vault.connect(owners[0]).setUpgradeTarget(vaultV2.target);

      await vault.connect(owners[0]).approveUpgradeTarget(vaultV2.target);

      await vault.connect(owners[1]).approveUpgradeTarget(vaultV2.target);

      await vault.connect(owners[2]).approveUpgradeTarget(vaultV2.target);

      await vault
        .connect(owners[0])
        .upgradeToAndCall(
          vaultV2.target as string,
          vaultV2.interface.encodeFunctionData("initialize", [23292n])
        );

      const balance = await vault.getNativeBalance();

      expect(balance).to.eql(23292n);

      const target = await vault.getUpgradeTarget();
      const signatures = await vault.getUpgradeSignatures();

      expect(target).to.eql(ethers.ZeroAddress);
      expect(signatures).to.have.length(0);
    });
  });

  describe("isOwner", function () {
    it("should return true for an owner address, otherwise false", async function () {
      const {
        contracts: { vault },
        accounts: { owners },
        constants: { addresses },
      } = await loadFixture(deploy);

      for (const address of owners) {
        const call = await vault.isOwner(address);
        expect(call).to.be.true;
      }

      const call = await vault.isOwner(addresses[0]);
      expect(call).to.be.false;
    });
  });

  describe("getOwners", function () {
    it("should return the owners' addresses", async function () {
      const {
        contracts: { vault },
        accounts: { owners },
      } = await loadFixture(deploy);

      const call = await vault.getOwners();

      const addresses = await Promise.all(
        owners.map((owner: Signer) => owner.getAddress())
      );

      expect(call).to.be.eql(addresses);
    });
  });

  describe("getThreshold", function () {
    it("should return the set threshold", async function () {
      const {
        contracts: { vault },
      } = await loadFixture(deploy);

      const call = await vault.getThreshold();

      expect(call).to.be.eq(2);
    });
  });

  describe("isTXExecutable", function () {
    it("should return false unless all conditions are met", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others, owners },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);

      let isExecutable = await vault.isTXExecutable(0);

      expect(isExecutable).to.be.false;

      await vault.connect(deployer).signTX(0, owners[1].address);

      isExecutable = await vault.isTXExecutable(0);

      expect(isExecutable).to.be.true;

      await vault.connect(deployer).executeTX(0, owners[1].address, 0, []);

      isExecutable = await vault.isTXExecutable(0);

      expect(isExecutable).to.be.false;
    });
  });
  describe("submitTx", function () {
    it("should only allow Pool contract", async function () {
      const {
        contracts: { vault },
        accounts: { others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = vault
        .connect(others[0])
        .submitTX(0, addresses[0], addresses[1], 100, others[0].address);

      await expect(call).to.be.revertedWithCustomError(vault, "NotPool");
    });

    it("should submit a native asset transaction without reverting", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await expect(call).to.not.be.reverted;
    });

    it("should submit an ERC20 transaction without reverting", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = vault
        .connect(deployer)
        .submitTX(0, addresses[0], addresses[1], 100, others[0].address);

      await expect(call).to.not.be.reverted;
    });

    it("should store the transaction", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const result = await call.wait();

      const log = result!.logs[0] as TXSubmittedEvent.Log;
      const index = log.args[0];

      const tx = await vault.getTX(index);

      expect(tx.token).to.be.eq(ethers.ZeroAddress);
      expect(tx.to).to.be.eq(addresses[1]);
      expect(tx.value).to.be.eq(100);
      expect(tx.signatures.length).to.be.eq(0);
      expect(tx.executed).to.be.eq(false);
    });

    it("should fire a TXSubmitted event", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const tx = vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await expect(tx).to.emit(vault, "TXSubmitted");
    });
  });

  describe("signTX", function () {
    it("should only allow owner account", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, addresses[0], addresses[1], 100, others[0].address);

      const call = vault.signTX(0, deployer.address);

      await expect(call).to.be.revertedWithCustomError(vault, "NotOwner");
    });

    it("should revert if already signed", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);
      const sign = vault.connect(deployer).signTX(0, owners[0].address);

      await expect(sign).to.be.revertedWithCustomError(vault, "AlreadySigned");
    });

    it("should revert if threshold is met", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others, owners },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);
      const sign = vault.connect(deployer).signTX(0, owners[0].address);

      await expect(sign).to.be.revertedWithCustomError(vault, "AlreadySigned");
    });

    it("should sign a transaction without reverting", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others, owners },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const sign = vault.connect(deployer).signTX(0, owners[0].address);

      await expect(sign).to.not.be.reverted;
    });

    it("should update the stored transaction", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, others, owners },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const result = await call.wait();

      const log = result!.logs[0] as TXSubmittedEvent.Log;
      const index = log.args[0];

      await vault.connect(deployer).signTX(index, owners[0].address);

      const tx = await vault.getTX(index);

      expect(tx.token).to.be.eq(ethers.ZeroAddress);
      expect(tx.to).to.be.eq(addresses[1]);
      expect(tx.value).to.be.eq(100);
      expect(tx.signatures.length).to.be.eq(1);
      expect(tx.signatures[0].by).to.be.eq(owners[0]);
      expect(tx.executed).to.be.eq(false);
    });

    it("should fire a TXSigned event", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const call = vault.connect(deployer).signTX(0, owners[0].address);

      await expect(call).to.emit(vault, "TXSigned");
    });
  });

  describe("executeTX", function () {
    it("should only allow pool contract", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const call = vault
        .connect(owners[0])
        .executeTX(0, owners[0].address, 0, []);

      await expect(call).to.be.revertedWithCustomError(vault, "NotPool");
    });

    it("should revert if missing enough signatures", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);

      const execute = vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 0, []);

      await expect(execute).to.be.revertedWithCustomError(
        vault,
        "NotEnoughSignatures"
      );
    });

    it("should execute a transaction without reverting (re. native asset)", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      const execute = await vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 0, []);

      await expect(execute).to.not.be.reverted;
    });

    it("should execute a transaction with fees without reverting (re. native asset)", async function () {
      const {
        contracts: { vault, configuration },
        accounts: { deployer, owners, others, role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await configuration.connect(role).addFeeTaker(others[0]);

      const previousBalanceOfRecipient = await others[0].provider.getBalance(
        addresses[1]
      );
      const previousBalanceOfFeeTaker = await others[0].provider.getBalance(
        others[0]
      );

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      const execute = await vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 400, [others[0]]);

      await execute.wait();

      const balanceOfRecipient = await others[0].provider.getBalance(
        addresses[1]
      );
      const balanceOfFeeTaker = await others[0].provider.getBalance(others[0]);

      expect(balanceOfRecipient).to.be.greaterThan(previousBalanceOfRecipient);
      expect(balanceOfRecipient).to.be.eql(previousBalanceOfRecipient + 96n);
      expect(balanceOfFeeTaker).to.be.greaterThan(previousBalanceOfFeeTaker);
      expect(balanceOfFeeTaker).to.be.eql(previousBalanceOfFeeTaker + 4n);
      expect(execute).to.not.be.reverted;
    });

    it("should execute a transaction without reverting (re. ERC20 asset)", async function () {
      const {
        contracts: { vault, erc20 },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(
          0,
          erc20.target,
          addresses[1],
          ethers.parseEther("0.05"),
          others[0].address
        );

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      const execute = vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 0, []);

      await expect(execute).to.not.be.reverted;
    });

    it("should execute a transaction with fees without reverting (re. ERC20 asset)", async function () {
      const {
        contracts: { vault, erc20, configuration },
        accounts: { deployer, owners, others, role },
        constants: { addresses },
      } = await loadFixture(deploy);

      await configuration.connect(role).addFeeTaker(others[0]);

      const previousBalanceOfRecipient = await erc20.balanceOf(others[0]);
      const previousBalanceOfFeeTaker = await erc20.balanceOf(others[0]);

      await vault
        .connect(deployer)
        .submitTX(
          0,
          erc20.target,
          addresses[1],
          ethers.parseEther("0.05"),
          others[0].address
        );

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      const execute = await vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 400, [others[0]]);

      await execute.wait();

      const balanceOfRecipient = await erc20.balanceOf(addresses[1]);
      const balanceOfFeeTaker = await erc20.balanceOf(others[0]);

      expect(balanceOfRecipient).to.be.greaterThan(previousBalanceOfRecipient);
      expect(balanceOfFeeTaker).to.be.greaterThan(previousBalanceOfFeeTaker);
      expect(execute).to.not.be.reverted;
    });

    it("should update the stored transaction", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      const call = await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      const result = await call.wait();

      const log = result!.logs[0] as TXSubmittedEvent.Log;
      const index = log.args[0];

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      await vault.connect(deployer).executeTX(0, owners[0].address, 0, []);

      const tx = await vault.getTX(index);

      expect(tx.token).to.be.eq(ethers.ZeroAddress);
      expect(tx.to).to.be.eq(addresses[1]);
      expect(tx.value).to.be.eq(100);
      expect(tx.signatures.length).to.be.eq(2);
      expect(tx.signatures[0].by).to.be.eq(owners[0]);
      expect(tx.signatures[1].by).to.be.eq(owners[1]);
      expect(tx.executed).to.be.eq(true);
    });

    it("should fire a TXExecuted event", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, owners, others },
        constants: { addresses },
      } = await loadFixture(deploy);

      await vault
        .connect(deployer)
        .submitTX(0, ethers.ZeroAddress, addresses[1], 100, others[0].address);

      await vault.connect(deployer).signTX(0, owners[0].address);
      await vault.connect(deployer).signTX(0, owners[1].address);

      const call = await vault
        .connect(deployer)
        .executeTX(0, owners[0].address, 0, []);

      await expect(call).to.emit(vault, "TXExecuted");
    });
  });

  describe("depositNative", function () {
    it("should allow deposit of native asset", async function () {
      const {
        contracts: { vault },
        accounts: { deployer, donor },
      } = await loadFixture(deploy);

      const value = ethers.parseEther("0.1");
      const address = await donor.getAddress();

      const previousBalance = await vault.getNativeBalance();

      await vault.connect(deployer).depositNative(address, { value });

      const [balance, balanceOf] = await Promise.all([
        vault.getNativeBalance(),
        vault.getNativeBalanceOf(address),
      ]);

      expect(balance).to.eq(value + previousBalance);

      expect(balanceOf).to.eql(value);
    });
  });

  describe("depositERC20", function () {
    it("should allow deposit of ERC20 assets", async function () {
      const {
        contracts: { vault, erc20 },
        accounts: { deployer, donor },
      } = await loadFixture(deploy);

      await erc20.connect(donor).approve(vault, ethers.parseEther("0.1"));

      const value = ethers.parseEther("0.1");
      const address = await donor.getAddress();

      const [previousBalance, previousBalanceOf] = await Promise.all([
        vault.getERC20Balance(erc20.target),
        vault.getERC20BalanceOf(erc20.target, address),
      ]);

      expect(previousBalance).to.eq(0);
      expect(previousBalanceOf).to.eq(0);

      await vault.connect(deployer).depositERC20(erc20.target, address, value);

      const [balance, balanceOf] = await Promise.all([
        vault.getERC20Balance(erc20.target),
        vault.getERC20BalanceOf(erc20.target, address),
      ]);

      expect(balance).to.eq(value);
      expect(balanceOf).to.eql(value);
    });

    it("should allow deposit of ERC20 assets with permit", async function () {
      const {
        contracts: { vault, erc20WithPermit },
        accounts: { deployer, donor },
      } = await loadFixture(deploy);

      const value = ethers.parseEther("0.1");
      const address = await donor.getAddress();

      const [previousBalance, previousBalanceOf] = await Promise.all([
        vault.getERC20Balance(erc20WithPermit.target),
        vault.getERC20BalanceOf(erc20WithPermit.target, address),
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
        spender: vault.target,
        value,
        nonce: nonces,
        deadline,
      };

      const signature = await donor.signTypedData(domain, types, values);

      let splitSignature = ethers.Signature.from(signature);

      await vault
        .connect(deployer)
        .depositERC20WithPermit(
          erc20WithPermit.target,
          address,
          value,
          deadline,
          splitSignature.v,
          splitSignature.r,
          splitSignature.s
        );

      const [balance, balanceOf] = await Promise.all([
        vault.getERC20Balance(erc20WithPermit.target),
        vault.getERC20BalanceOf(erc20WithPermit.target, address),
      ]);

      expect(balance).to.eq(value);
      expect(balanceOf).to.eql(value);
    });
  });
});
