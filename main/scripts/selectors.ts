import {
  Registry__factory,
  PoolManager__factory,
  Mint__factory,
} from "../typechain-types";

export const SELECTORS = {
  Registry: [
    Registry__factory.createInterface().getFunction("register").selector,
    Registry__factory.createInterface().getFunction("update").selector,
    Registry__factory.createInterface().getFunction("batchRegister").selector,
    Registry__factory.createInterface().getFunction("batchUpdate").selector,
  ],
  PoolManager: [
    PoolManager__factory.createInterface().getFunction("deployPool").selector,
  ],
  Minter: [Mint__factory.createInterface().getFunction("mint").selector],
};
