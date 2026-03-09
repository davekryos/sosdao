import { expect } from "chai";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { asBytes32, deployTestStack } from "../scripts";

describe("Registered", function () {
  async function deploy() {
    return deployTestStack();
  }

  describe("getAddress", () => {
    it("should return a registered address", async function () {
      const {
        contracts: { registered, registry },
        constants: { addresses },
        accounts: { role },
      } = await loadFixture(deploy);

      const name = asBytes32("A_CONTRACT");

      await registry.connect(role).register(name, addresses[0]);

      const address = await registered.get(name);

      expect(address).to.be.hexEqual(addresses[0]);
    });
  });

  describe("setRegistry", () => {
    it("should update a registered address", async function () {
      const {
        contracts: { registered, registry },
        constants: { addresses },
      } = await loadFixture(deploy);

      let registryAddress = await registered.getRegistry();

      expect(registryAddress).to.be.hexEqual(await registry.getAddress());

      await registered.setRegistry(addresses[1]);

      registryAddress = await registered.getRegistry();

      expect(registryAddress).to.be.hexEqual(addresses[1]);
    });
  });
});
