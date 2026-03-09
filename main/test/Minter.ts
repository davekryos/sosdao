import { expect } from "chai";
import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { TransferEvent } from "../typechain-types/contracts/platform/nft/Mint";
import { DonationRegisteredEvent } from "../typechain-types/contracts/platform/registry/Registry";

import { dataURI, deployTestStack, generateSVG } from "../scripts";
import { o } from "ramda";

describe("Mint.sol", function () {
  async function deploy() {
    return deployTestStack();
  }

  describe("UUPSUpgradeable", () => {
    it("should be upgradable only by authority EOA", async function () {
      const {
        contracts: { mint },
        accounts,
      } = await loadFixture(deploy);

      const MintImpl = await ethers.getContractFactory("MintV2");
      const mintV2 = await MintImpl.connect(accounts.deployer).deploy();

      const call = mint
        .connect(accounts.deployer)
        .upgradeToAndCall(
          mintV2.target as string,
          mintV2.interface.encodeFunctionData("initialize", [
            "Not SOS DAO",
            "NSOSDNT",
          ])
        );

      expect(call).to.be.revertedWithCustomError(
        mint,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should be upgradable", async function () {
      const {
        contracts: { mint },
        accounts,
      } = await loadFixture(deploy);

      const MintImpl = await ethers.getContractFactory("MintV2");
      const mintV2 = await MintImpl.connect(accounts.deployer).deploy();

      await mint
        .connect(accounts.authority)
        .upgradeToAndCall(
          mintV2.target as string,
          mintV2.interface.encodeFunctionData("initialize", [
            "Not SOS DAO",
            "NSOSDNT",
          ])
        );

      const name = await mint.name();
      const symbol = await mint.symbol();

      expect(name).to.be.eq("Not SOS DAO");
      expect(symbol).to.be.eq("NSOSDNT");
    });
  });

  describe("AccessControl", function () {
    it("should mint only for minter role account", async function () {
      const { contracts, accounts, constants } = await loadFixture(deploy);

      const mint = contracts.mint
        .connect(accounts.donor)
        .mint(
          accounts.donor,
          ethers.ZeroAddress,
          constants.AMOUNT,
          constants.POOL_ID
        );

      await expect(mint).to.be.revertedWithCustomError(
        contracts.mint,
        "AccessManagedUnauthorized"
      );
    });
  });

  describe("IERC721Metadata", function () {
    it("should return the name", async function () {
      const { contracts, constants } = await loadFixture(deploy);

      const name = await contracts.mint.name();

      expect(name).to.be.eq(constants.ERC721_NAME);
    });

    it("should return the symbol", async function () {
      const { contracts, constants } = await loadFixture(deploy);

      const name = await contracts.mint.symbol();

      expect(name).to.be.eq(constants.ERC721_SYMBOL);
    });

    it("should emit a Transfer event", async function () {
      const {
        contracts,
        accounts,
        constants,
        functions: { deployPool },
      } = await loadFixture(deploy);

      await deployPool();

      const address = await accounts.donor.getAddress();

      const mint = await contracts.mint
        .connect(accounts.minter)
        .mint(
          accounts.donor,
          contracts.erc20.target,
          constants.AMOUNT,
          constants.POOL_ID
        );

      const result = await mint.wait();

      const log = result!.logs[0] as TransferEvent.Log;
      expect(mint).to.emit(contracts.mint, "Transfer");

      expect(log.args[0]).to.be.hexEqual(ethers.ZeroAddress);
      expect(log.args[1]).to.be.hexEqual(address);
      expect(log.args[2]).to.be.eq(1);
    });

    it("should return the owner of a token", async function () {
      const {
        contracts,
        accounts,
        constants,
        functions: { deployPool },
      } = await loadFixture(deploy);

      await deployPool();

      await contracts.mint
        .connect(accounts.minter)
        .mint(
          accounts.donor,
          contracts.erc20.target,
          constants.AMOUNT,
          constants.POOL_ID
        );

      const owner = await contracts.mint.ownerOf(1);

      const address = await accounts.donor.getAddress();

      expect(owner).to.be.hexEqual(address);
    });

    it("should return the balance of an account", async function () {
      const {
        contracts,
        accounts,
        constants,
        functions: { deployPool },
      } = await loadFixture(deploy);

      await deployPool();

      await contracts.mint
        .connect(accounts.minter)
        .mint(
          accounts.donor,
          contracts.erc20.target,
          constants.AMOUNT,
          constants.POOL_ID
        );

      const owner = await contracts.mint.balanceOf(accounts.donor);

      expect(owner).to.be.eq(1);
    });
  });

  describe("Mint", function () {
    describe("mint", function () {
      it("should mint an ERC721 token (ref. native asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            ethers.ZeroAddress,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await expect(mint).not.to.be.reverted;
      });

      it("should emit a DonationRegistered event (ref. native asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const address = await accounts.donor.getAddress();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            ethers.ZeroAddress,
            constants.AMOUNT,
            constants.POOL_ID
          );

        const result = await mint.wait();

        const log = result!.logs[1] as DonationRegisteredEvent.Log;

        expect(mint).to.emit(contracts.registry, "DonationRegistered");

        expect(log.topics[1]).to.be.eq(constants.POOL_ID);
        expect(log.topics[2]).to.be.hexEqual(address);
        expect(log.topics[3]).to.be.hexEqual(ethers.ZeroAddress);
      });

      it("should mint an ERC721 token (ref. ERC20 asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            contracts.erc20.target,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await expect(mint).not.to.be.reverted;
      });

      it("should emit a DonationRegistered event (ref. ERC20 asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const address = await accounts.donor.getAddress();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            contracts.erc20.target,
            constants.AMOUNT,
            constants.POOL_ID
          );

        const result = await mint.wait();

        const log = result!.logs[1] as DonationRegisteredEvent.Log;

        expect(mint).to.emit(contracts.mint, "DonationRegistered");

        expect(log.topics[1]).to.be.eq(constants.POOL_ID);
        expect(log.topics[2]).to.be.hexEqual(address);
        expect(log.topics[3]).to.be.hexEqual(contracts.erc20.target as string);
      });
    });

    describe("SVG", function () {
      it("should return an SVG representation (ref. native asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            ethers.ZeroAddress,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await mint.wait();

        const svg = await contracts.mint.SVG(1);

        expect(svg).to.be.eql(
          generateSVG(
            "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            constants.NATIVE_ASSET_SYMBOL,
            constants.DECIMAL_AMOUNT
          )
        );
      });

      it("should return an SVG representation (ref. ERC20 asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            contracts.erc20.target,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await mint.wait();

        const svg = await contracts.mint.SVG(1);

        expect(svg).to.be.eql(
          generateSVG(
            "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            constants.ERC20_SYMBOL,
            constants.DECIMAL_AMOUNT
          )
        );
      });
    });

    describe("tokenURI", function () {
      it("should return a tokenURI (Base64) (ref. native asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            ethers.ZeroAddress,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await mint.wait();

        const uri = await contracts.mint.tokenURI(1);

        const json = JSON.parse(uri);

        expect(json).to.be.eql(
          dataURI(
            "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            constants.NATIVE_ASSET_SYMBOL,
            constants.DECIMAL_AMOUNT
          )
        );
      });

      it("should return a tokenURI (Base64) (ref. ERC20 asset)", async function () {
        const {
          contracts,
          accounts,
          constants,
          functions: { deployPool },
        } = await loadFixture(deploy);

        await deployPool();

        const mint = await contracts.mint
          .connect(accounts.minter)
          .mint(
            accounts.donor,
            contracts.erc20.target,
            constants.AMOUNT,
            constants.POOL_ID
          );

        await mint.wait();

        const uri = await contracts.mint.tokenURI(1);

        const json = JSON.parse(uri);

        expect(json).to.be.eql(
          dataURI(
            "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
            constants.ERC20_SYMBOL,
            constants.DECIMAL_AMOUNT
          )
        );
      });
    });
  });
});
