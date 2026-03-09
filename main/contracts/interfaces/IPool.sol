// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import {PoolParameters, Request} from "../libraries/Data.sol";

/**
 * @title IPool
 * @notice Defines the basic interface for the `Pool` contract.
 */
interface IPool {
    /// @notice Initializes the pool with a specific registry, version, identifier, vault implementation, and parameters.
    /// @param _registry The address of the registry contract.
    /// @param _version The version number of the pool.
    /// @param _id The unique identifier of the pool.
    /// @param _vaultImplementation The address of the vault implementation to use.
    /// @param _parameters The parameters for the pool specified in a PoolParameters struct.
    function initialize(
        address _registry,
        uint256 _version,
        bytes32 _id,
        address _vaultImplementation,
        PoolParameters calldata _parameters
    ) external;

    /// @notice Allows users to deposit native blockchain asset.
    function depositNative() external payable;

    /// @notice Allows users to deposit ERC20 tokens.
    /// @param _token The address of the ERC20 token to deposit.
    /// @param _value The amount of the ERC20 token to deposit.
    function depositERC20(address _token, uint256 _value) external;

    /// @notice Allows for the deposit of ERC20 tokens into the contract using a permit, thereby avoiding the need for a separate approval step.
    /// @param _token The address of the ERC20 token to be deposited.
    /// @param _value The amount of the ERC20 token to deposit.
    /// @param _deadline The timestamp until which the permit is valid, after which the permit can no longer be used.
    /// @param _permitV v signature param
    /// @param _permitR r signature param
    /// @param _permitS s signature param
    function depositERC20WithPermit(
        address _token,
        uint256 _value,
        uint256 _deadline,
        uint8 _permitV,
        bytes32 _permitR,
        bytes32 _permitS
    ) external;

    /// @notice Retrieves the balance of native currency held.
    /// @return uint256 The balance of native currency held by the pool.
    function getNativeBalance() external view returns (uint256);

    /// @notice Retrieves the native asset balance for a specified address.
    /// @param _address The address whose native balance is to be queried.
    function getNativeBalanceOf(
        address _address
    ) external view returns (uint256);

    /// @notice Retrieves the balance of a specific ERC20 token held.
    /// @param _token The address of the ERC20 token.
    /// @return uint256 The balance of the specified ERC20 token held by the pool.
    function getERC20Balance(address _token) external view returns (uint256);

    /// @notice Retrieves the balance of a specified ERC20 for a specified address.
    /// @param _token The address of the ERC20 token.
    /// @param _address The address whose token balance is to be queried.
    function getERC20BalanceOf(
        address _token,
        address _address
    ) external view returns (uint256);

    /// @notice Retrieves the address of the vault associated with this pool.
    /// @return address The address of the vault.
    function getVaultAddress() external view returns (address);

    /// @notice Submits a transaction request for later approval and execution.
    /// @param request The details of the transaction request.
    /// @param _submitter The address submitting the transaction request.
    function submitTX(Request calldata request, address _submitter) external;

    /// @notice Signs a submitted transaction request.
    /// @param request The transaction request to sign.
    /// @param _signer The address signing the transaction request.
    function signTX(Request calldata request, address _signer) external;

    /// @notice Executes a previously approved transaction request.
    /// @param request The transaction request to execute.
    /// @param _executor The address executing the transaction.
    function executeTX(Request calldata request, address _executor) external;

    /// @notice Determines whether a transaction request meets all criteria for execution.
    /// @param request The transaction request to evaluate.
    /// @return bool Returns true if the transaction is executable, false otherwise.
    function isTXExecutable(Request calldata request) external returns (bool);
}
