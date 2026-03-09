# Integration Guide

...

## Changes

The following is a list of changes related to the integration compared to the previous
version, SOS Chain.

### Registry

Registry now returns addresses for the following identifiers (`bytes32`).

To cast a string to `bytes32` in JS/TS, use `ethers.encodeBytes32String` function.

| Identifier            | Contract          |
| --------------------- | ----------------- |
| "AUTHORITY"           | Authority.sol     |
| "CONFIGURATION"       | Configuration.sol |
| "POOL_MANAGER"        | PoolManager.sol   |
| "POOL_IMPLEMENTATION" | Pool.sol          |
| "MINT"                | Mint.sol          |

### Fund Manager -> Pool Manager

- `FundManager` contract is now named `PoolManager`.

- `createFund` and `createFundWithSafe` functions are removed in favor of `deployPool`
  function.

  ```solidity
  function deployPool(
    string memory _name,
    string memory _description,
    uint24 _feeRatio,
    address[] calldata _vault_owners,
    uint256 _vault_threshold
  ) external;
  ```

- All deployed pools are now backed by a multi-signature wallet contract (see `Vault.sol`).

- Upon pool deployment, a `PoolDeployed` event is emitted by the `PoolManager` contract.
  The event no longer has a `focus` field.

  ```solidity
  event PoolDeployed(
    uint256 indexed id,
    address indexed at,
    string name,
    string description
  );
  ```

- `PoolManager` contract no longer acts as a proxy to a `Pool` contract. Calls must
  be made to the `Pool` directly.

### Fund/FundV1 -> Pool

- `Fund` and `FundV1` contracts are now named `Pool`.

- Each `Pool` is now backed by a `Vault` contract, deployed during `Pool` deployment.

- Pools have no longer a `focus` variable.

- Pools do not store `name` and `description` values in the contract storage. They
  are accessible only via the `PoolDeployed` event.

- Pools now allow native asset deposits as well as ERC20 asset deposits. Wherever
  an asset is concerned, a non-zero asset address represents an ERC20 token, while
  a zero asset address represents a native asset.

  ```solidity
    // example
    struct Donation {
      address donor;   // Address of the donor.
      uint256 pool;    // ID of the pool to which the donation is made.
      uint256 amount;  // Amount donated.
      address asset;   // Address of ERC20 asset. 0x for native.
    }
  ```

- The following functions may be called to determine the assets supported by a
  pool.

  ```solidity
  function getEnabledAssets() external view returns (address[] memory);

  function isAssetEnabled(address _address) external view returns (bool);
  ```

  If a pool supports native asset donations, `isAssetEnabled(0x)` will
  return true, and the returned array from `getEnabledAssets()` will include
  `0x`.

- `Donation` and `DonationStorage` contracts have been removed. Donation data are
  now held by the `Pool` contract, and the ERC721 token is minted by the `Pool` contract
  as well.

- `PoolManager` contract is granted the `MINTER_ADMIN_ROLE` during deployment. This
  allows the `PoolManager` contract to grant `MINTER_ROLE` to newly deployed pools
  via `Authority` contract.

### ERC721

- `NFTDescriptor` is no longer a standalone contract. It has been renamed to `Descriptor`,
  and the `ERC721` contract (`Mint.sol`) now inherits from `Descriptor`.

- The interface of the `Mint` contract has been simplified.

  ```solidity
  interface IMint {
    function SVG(uint256 _tokenId) external view returns (string memory);

    function tokenURI(uint256 _tokenId) external view returns (string memory);

    function mint(
        address _recipient,
        address _asset,
        uint256 _amount,
        uint256 _pool
    ) external returns (uint256);
  }
  ```

- Functionality related to the SVG creation has been moved to specific libraries:
  `Colors`, `JSON`, `SVG`.

- `Donation` and `DonationStorage` contracts have been removed. `mint` function is
  now called by the `Pool` contract (all pools are granted `MINTER_ROLE` by the
  `PoolManager` contract during deployment).
