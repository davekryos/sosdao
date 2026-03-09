// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/IAccessManaged.sol";

import {Donation, PoolParameters} from "../libraries/Data.sol";

/**
 * @title IRegistry
 * @notice Defines the basic interface for the `Registry` contract.
 */
interface IRegistry is IAccessManaged {
    /// @notice Initializes the contract with an authority address, owner address, and a symbol for identification.
    /// @param _authority The address that will have administrative authority over certain aspects of the contract.
    /// @param _owner The address that will own the contract and have overarching administrative control.
    /// @param _symbol A unique symbol to identify the contract or its purpose.
    function initialize(
        address _authority,
        address _owner,
        string memory _symbol
    ) external;

    /// @notice Generates a unique identifier based on an initial ID and a version number.
    /// @param _id The original identifier to be versioned.
    /// @param _version The version number to append to the original ID.
    /// @return bytes32 Returns a unique versioned identifier.
    function generateVersionedId(
        bytes32 _id,
        uint256 _version
    ) external view returns (bytes32);

    /// @notice Generates a unique identifier based on a numeric ID and an address.
    /// @param _id The numeric ID component of the new identifier.
    /// @param _address The address component to be combined with the numeric ID.
    /// @return bytes32 Returns a unique identifier based on the given ID and address.
    function generateAddressedId(
        uint256 _id,
        address _address
    ) external view returns (bytes32);

    /// @notice Retrieves the address of the ACL (Access Control List) manager.
    /// @return address Returns the address of the ACL manager.
    function getACLManager() external view returns (address);

    /**
     * @notice Retrieves the address associated with a given contract name.
     * @dev If the name is not registered, the function reverts with the NotFound error.
     * @param _id The name of the contract to query.
     * @return address The contract address associated with the given name.
     */
    function get(bytes32 _id) external view returns (address);

    /// @notice Retrieves the address associated with a specific ID and version number.
    /// @param _id The identifier for which the versioned address is required.
    /// @param _version The specific version number of the address to retrieve.
    /// @return address Returns the address associated with the specified ID and version.
    function getVersioned(
        bytes32 _id,
        uint256 _version
    ) external view returns (address);

    /// @notice Retrieves the address of the pool associated with a specific ID.
    /// @param _id The unique identifier of the pool to retrieve the address for.
    /// @return address Returns the address of the pool associated with the specified ID.
    function getPool(bytes32 _id) external view returns (address);

    /// @notice Retrieves the details of a donation entry by its ID.
    /// @param _id The identifier of the donation to retrieve details for.
    /// @return Donation Returns a struct with donation details corresponding to the specified ID.
    function getDonation(bytes32 _id) external view returns (Donation memory);

    /// @notice Registers a new pool with a given ID, address, name, and description.
    /// @param _id The unique identifier to register the new pool under.
    /// @param _address The address of the new pool.
    /// @param _name The name of the pool.
    /// @param _description The description of the pool.
    function registerPool(
        bytes32 _id,
        address _address,
        string calldata _name,
        string calldata _description
    ) external;

    /**
     * @notice Registers a new contract name and address.
     * @param _name The name of the contract to register.
     * @param _address The Ethereum address of the contract.
     */
    function register(bytes32 _name, address _address) external;

    /**
     * @notice Updates the address for an existing contract name.
     * @param _name The name of the contract to update.
     * @param _address The new Ethereum address of the contract.
     */
    function update(bytes32 _name, address _address) external;

    /**
     * @notice Retrieves the addresses for a batch of contract names.
     * @param _names An array of contract names to query.
     * @return address[] An array of addresses associated with the given names.
     */
    function batchGet(
        bytes32[] memory _names
    ) external view returns (address[] memory);

    /**
     * @notice Registers multiple contract names and addresses in one transaction.
     * @param _name An array of contract names to register.
     * @param _address An array of Ethereum addresses of the contracts.
     */
    function batchRegister(
        bytes32[] memory _name,
        address[] memory _address
    ) external;

    /**
     * @notice Updates the addresses for multiple contract names in one transaction.
     * @param _name An array of contract names to update.
     * @param _address An array of new Ethereum addresses for the contracts.
     */
    function batchUpdate(
        bytes32[] memory _name,
        address[] memory _address
    ) external;
}
