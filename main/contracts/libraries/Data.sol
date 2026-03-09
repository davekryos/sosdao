// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

struct Donation {
    bytes32 pool; // ID of the pool.
    address donor; // Address of the donor.
    uint256 amount; // Amount donated.
    address asset; // Address of ERC20 token. 0x for native.
}

struct Signature {
    address by;
}

struct Transaction {
    uint256 id; // Unique id of the transaction.
    address token; // ERC20 token address, or address(0) for Ether.
    address to; // Recipient address.
    uint256 value; // Amount to transfer.
    Signature[] signatures; // List of signatures.
    bool executed; // Whether the transaction has been executed.
}

enum Status {
    Pending,
    Approved,
    Executed
}

struct Request {
    uint256 id;
    bytes32 poolId;
    uint256 value;
    address token;
    address recipient;
    Status status;
    bytes32[2][] checks; // List of checks.
    uint256 pendingCheckCount;
    Signature[] signatures; // List of signatures.
    uint256 signatureCount; // Number of collected signatures.
    string description;
}

struct PoolParameters {
    string name;
    string description;
    uint24 feeRatio;
    address[] permittedAssets;
    VaultParameters vaultParameters;
}

struct VaultParameters {
    address[] owners;
    uint256 threshold;
}
