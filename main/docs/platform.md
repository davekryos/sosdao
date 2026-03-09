# SOS DAO Documentation

## Platform Configuration

Platform configuration is managed via `Configuration.sol`.

## Access Management

Access management is handled via `Authority.sol` which extends Open Zeppelin's Access
Manager implementation (see [documentation](https://docs.openzeppelin.com/contracts/5.x/api/access#AccessManager)).

Roles are labeled for ease of reference.

The role ids can be computed from the role labels.

```c
// Solidity
uint64 ROLE_ID = uint64(uint(keccak256("ROLE_LABEL")));
```

```js
// JS / TS
export function getRoleId(roleName: string) {
  const id = ethers.id(roleName);
  const uint = ethers.getUint(id);

  return BigInt.asUintN(64, uint);
}
```

| Label                   | Contract              |
| ----------------------- | --------------------- |
| REGISTRATION_ROLE       | Registry.sol          |
| POOL_CREATION_ROLE      | PoolManager.sol       |
| POOL_CONFIGURATION_ROLE | PoolConfiguration.sol |
| CONFIGURATION_ROLE      | Configuration.sol     |
| MANAGER_ROLE            | Configuration.sol     |
| MINTER_ADMIN_ROLE       | Authority.sol         |
| MINTER_ROLE             | Mint.sol              |

## Contracts

### Pool Manager

The `PoolManager` contract inherits from:

- `Registered`
- [`Initializable`](https://docs.openzeppelin.com/contracts/5.x/api/proxy#Initializable)
  [`AccessManaged`](https://docs.openzeppelin.com/contracts/5.x/api/access#AccessManaged)
  (Open Zeppelin)

#### Deploying Pools

The external function `deployPool` deploys a new pool with the `msg.sender` as
the owner and the given fee ratio. It will then register the new pool and emit a
`PoolDeployed` event with the index of the pool, the pool's address, and the
pool's name and description.

- deploy a pool (via `PoolDeploy`) and
- register the deployed pool (via `PoolRegistry`), and,
- emit a `PoolDeployed` event.

The deployed pools are clones of the pool implementation contract at address
`_poolImplementationAddress`. The underlying
implementation contract may be upgraded via calling the `setImplementation`
method.

### Pool

The `Pool` contracts inherits from:

- `PoolConfiguration`
- [`Initializable`](https://docs.openzeppelin.com/contracts/5.x/api/proxy#Initializable)
  (Open Zeppelin)

During initialization, the `Pool` contract will deploy an underlying `Vault`.
The `Vault` contract is initialized with the given `_vOwners` and `_vThreshold` arguments.

### Vault
