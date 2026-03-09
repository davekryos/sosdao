// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import {Transaction} from "../libraries/Data.sol";

/**
 * @title IVault
 * @notice Defines the basic interface for the `Vault` contract.
 */
interface IVault {
    /// @notice Fallback function to receive native.
    receive() external payable;

    /// @notice Retrieves the balance of native currency (like ETH) held by this contract.
    /// @return uint256 Returns the balance of native currency held by the contract.
    function getNativeBalance() external view returns (uint256);

    /// @notice Retrieves the balance of the native currency (like ETH) for a specified address.
    /// @param _address The address to query the native balance for.
    /// @return uint256 Returns the amount of native currency held by the specified address.
    function getNativeBalanceOf(
        address _address
    ) external view returns (uint256);

    /// @notice Returns the balance of a specified ERC20 token held by this contract.
    /// @param _token The address of the ERC20 token to check the balance for.
    /// @return uint256 Returns the balance of the specified ERC20 token held by this contract.
    function getERC20Balance(address _token) external view returns (uint256);

    /// @notice Retrieves the balance of a specified ERC20 token for a given address.
    /// @param _token The address of the ERC20 token.
    /// @param _address The address to query the ERC20 token balance for.
    /// @return uint256 Returns the amount of the specified ERC20 token held by the given address.
    function getERC20BalanceOf(
        address _token,
        address _address
    ) external view returns (uint256);

    /// @notice Handles deposit of native asset into the contract.
    /// @param _address The address to which the deposited balance will be credited.
    /// Emits a `Deposited` event indicating a successful deposit.
    function depositNative(address _address) external payable;

    /// @notice Allows for the deposit of ERC20 tokens into the contract and credits them to a specified address.
    /// @param _token The address of the ERC20 token to be deposited.
    /// @param _address The address to which the deposited tokens will be credited.
    /// @param _value The amount of ERC20 tokens to deposit.
    function depositERC20(
        address _token,
        address _address,
        uint256 _value
    ) external;

    /// @notice Allows for the deposit of ERC20 tokens into the contract using a permit, crediting them to a specified address without requiring a prior separate approval transaction.
    /// @param _token The address of the ERC20 token to be deposited.
    /// @param _from The address from which the tokens will be transferred.
    /// @param _value The amount of ERC20 tokens to be deposited.
    /// @param _deadline The time by which the permit must be used before it expires.
    /// @param _permitV v signature param
    /// @param _permitR r signature param
    /// @param _permitS s signature param
    function depositERC20WithPermit(
        address _token,
        address _from,
        uint256 _value,
        uint256 _deadline,
        uint8 _permitV,
        bytes32 _permitR,
        bytes32 _permitS
    ) external;

    /// @notice Checks if an address is an owner of the vault.
    /// @param _address The address to check.
    /// @return True if the address is an owner, false otherwise.
    function isOwner(address _address) external view returns (bool);

    /// @notice Retrieves the list of owner addresses.
    /// @return An array of owner addresses.
    function getOwners() external view returns (address[] memory);

    /// @notice Retrieves the transaction threshold.
    /// @return The number of signatures required to execute a transaction.
    function getThreshold() external view returns (uint256);

    /// @notice Retrieves a transaction.
    /// @param _id The id of the transaction to check.
    /// @return The Transaction struct.
    function getTX(uint256 _id) external view returns (Transaction memory);

    /// @notice Submits a new transaction to the vault.
    /// @param _id Unique id of the transaction, equal to request's id.
    /// @param _token ERC20 token address (use address(0) for native).
    /// @param _to Recipient address.
    /// @param _value Amount of tokens or native to transfer.
    function submitTX(
        uint256 _id,
        address _token,
        address _to,
        uint256 _value,
        address _submitter
    ) external;

    /// @notice Signs an existing transaction.
    /// @param _id The id of the transaction to sign.
    function signTX(uint256 _id, address _signer) external;

    /// @notice Checks if a transaction is ready for execution.
    /// @param _id The id of the transaction to check.
    /// @return True if the transaction can be executed, false otherwise.
    function isTXExecutable(uint256 _id) external view returns (bool);

    /// @notice Executes a signed transaction. Only callable by the deploying Pool.
    /// @param _id The id of the transaction to execute.
    /// @param _executor The address of the owner executing the TX.
    /// @param _feeRatio The fee ratio to be distributed.
    /// @param _feeTakers The addresses of the fee takers.
    function executeTX(
        uint256 _id,
        address _executor,
        uint24 _feeRatio,
        address[] memory _feeTakers
    ) external;

    /// @notice Determines if a specified address has signed for a given ID.
    /// @param _id The identifier associated with a specific event or transaction to check signatures for.
    /// @param _address The address to verify the signature status for.
    /// @return bool Returns true if the address has signed for the specified ID, otherwise false.
    function hasSigned(
        uint256 _id,
        address _address
    ) external view returns (bool);

    /// @notice Determines if the specified address has approved the current upgrade.
    /// @param _address The address to check for upgrade approval.
    /// @return bool Returns true if the specified address has approved the upgrade, otherwise false.
    function hasApprovedUpgrade(address _address) external view returns (bool);

    /// @notice Retrieves the list of addresses that have signed the current upgrade.
    /// @return address[] Returns an array of addresses that have signed the upgrade.
    function getUpgradeSignatures() external view returns (address[] memory);

    /// @notice Returns the address of the target contract for the upgrade.
    /// @return address Returns the address of the target contract for the upgrade.
    function getUpgradeTarget() external view returns (address);

    /// @notice Sets the address of the target contract for future upgrades.
    /// @param _target The address of the new target contract for the upgrade.
    function setUpgradeTarget(address _target) external;

    /// @notice Approves a proposed upgrade target contract address.
    /// @param _target The address of the target contract to approve for the upgrade.
    function approveUpgradeTarget(address _target) external;
}
