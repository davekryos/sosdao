import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { createRandomAddress, deployTestStack } from "../scripts";

describe("Configuration", function () {
  const addresses = createRandomAddress(5);

  async function deploy() {
    return deployTestStack();
  }

  describe("getFeeTakers / countFeeTakers / isFeeTaker", () => {
    it("should get, count, and check fee takers", async function () {
      const {
        contracts: { configuration },
        accounts: { role },
      } = await loadFixture(deploy);

      await configuration.connect(role).addFeeTaker(addresses[0]);
      await configuration.connect(role).addFeeTaker(addresses[1]);

      const feeTakers = await configuration.getFeeTakers();
      const isFeeTaker = await configuration.isFeeTaker(addresses[0]);
      const isNotFeeTaker = await configuration.isFeeTaker(addresses[3]);
      const count = await configuration.countFeeTakers();

      expect(feeTakers).to.eql([addresses[0], addresses[1]]);
      expect(isFeeTaker).to.be.true;
      expect(isNotFeeTaker).to.be.false;
      expect(count).to.be.eq(2);
    });
  });

  describe("addFeeTaker", () => {
    it("should be restricted", async function () {
      const { contracts } = await loadFixture(deploy);

      const call = contracts.configuration.addFeeTaker(addresses[0]);

      await expect(call).to.be.revertedWithCustomError(
        contracts.configuration,
        "AccessManagedUnauthorized"
      );
    });

    it("should add a new fee taker", async function () {
      const { contracts, accounts } = await loadFixture(deploy);

      await contracts.configuration
        .connect(accounts.role)
        .addFeeTaker(addresses[0]);

      const feeTakers = await contracts.configuration.getFeeTakers();

      expect(feeTakers).to.have.length(1);
    });
  });

  describe("removeFeeTaker", () => {
    it("should be restricted", async function () {
      const { contracts } = await loadFixture(deploy);

      const call = contracts.configuration.removeFeeTaker(addresses[1]);

      await expect(call).to.be.revertedWithCustomError(
        contracts.configuration,
        "AccessManagedUnauthorized"
      );
    });

    it("should remove a fee taker", async function () {
      const { contracts, accounts } = await loadFixture(deploy);

      await contracts.configuration
        .connect(accounts.role)
        .addFeeTaker(addresses[0]);
      await contracts.configuration
        .connect(accounts.role)
        .addFeeTaker(addresses[1]);

      await contracts.configuration
        .connect(accounts.role)
        .removeFeeTaker(addresses[1]);

      const feeTakers = await contracts.configuration.getFeeTakers();

      expect(feeTakers).to.have.length(1);
    });
  });
});
