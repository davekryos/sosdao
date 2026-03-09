// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/manager/AccessManagedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IRegistry} from "../../interfaces/IRegistry.sol";

import {Donation, PoolParameters} from "../../libraries/Data.sol";
import {Exists, LengthMismatch, NotFound, PoolNotFound} from "../../libraries/Errors.sol";

contract Registry is
    IRegistry,
    OwnableUpgradeable,
    AccessManagedUpgradeable,
    UUPSUpgradeable
{
    string public NATIVE_ASSET_SYMBOL;

    bytes32 internal constant ACL_MANAGER = "ACL_MANAGER";

    // Mapping from names (as bytes32) to contract addresses.
    mapping(bytes32 => address) internal contracts;

    // Mapping from pool ids to pool addresses.
    mapping(bytes32 => address) internal pools;

    // Mapping from donation ids to donation data.
    mapping(bytes32 => Donation) internal donations;

    uint256[50] private __gap;

    constructor() {
        _disableInitializers();
    }

    // @inheritdoc IRegistry
    function initialize(
        address _authority,
        address _owner,
        string memory _symbol
    ) external initializer {
        __Ownable_init(_owner);
        __AccessManaged_init(_authority);
        __UUPSUpgradeable_init();

        NATIVE_ASSET_SYMBOL = _symbol;
        contracts[ACL_MANAGER] = _authority;
    }

    // -----------------------------------------------------------------
    // External API
    // -----------------------------------------------------------------

    // @inheritdoc IRegistry
    function generateVersionedId(
        bytes32 _id,
        uint256 _version
    ) public view onlyProxy returns (bytes32) {
        return keccak256(abi.encode(_id, _version));
    }

    // @inheritdoc IRegistry
    function generateAddressedId(
        uint256 _id,
        address _address
    ) public view onlyProxy returns (bytes32) {
        return keccak256(abi.encode(_id, _address));
    }

    // @inheritdoc IRegistry
    function getACLManager() public view onlyProxy returns (address) {
        return contracts[ACL_MANAGER];
    }

    // @inheritdoc IRegistry
    function getPool(bytes32 _id) public view onlyProxy returns (address) {
        return pools[_id];
    }

    // @inheritdoc IRegistry
    function getDonation(
        bytes32 _id
    ) public view onlyProxy returns (Donation memory) {
        return donations[_id];
    }

    // @inheritdoc IRegistry
    function get(
        bytes32 _id
    ) public view whenRegistered(_id) onlyProxy returns (address) {
        return contracts[_id];
    }

    // @inheritdoc IRegistry
    function getVersioned(
        bytes32 _id,
        uint256 _version
    ) public view whenRegistered(_id) onlyProxy returns (address) {
        bytes32 versionedId = generateVersionedId(_id, _version);

        return contracts[versionedId];
    }

    // @inheritdoc IRegistry
    function batchGet(
        bytes32[] memory _names
    ) public view onlyProxy returns (address[] memory) {
        uint256 length = _names.length;
        address[] memory addresses = new address[](length);

        unchecked {
            for (uint256 i; i < length; i++) {
                addresses[i] = get(_names[i]);
            }
        }

        return addresses;
    }

    // -----------------------------------------------------------------
    // Acess Controlled External API (Pools)
    // -----------------------------------------------------------------

    // @inheritdoc IRegistry
    function registerPool(
        bytes32 _id,
        address _address,
        string calldata _name,
        string calldata _description
    ) public restricted onlyProxy whenPoolIsNotRegistered(_id) {
        pools[_id] = _address;

        emit PoolRegistered(_id, _address, _name, _description);
    }

    // -----------------------------------------------------------------
    // Acess Controlled External API (Donations)
    // -----------------------------------------------------------------

    // @inheritdoc IRegistry
    function registerDonation(
        uint256 _id,
        Donation calldata _donation
    ) public restricted onlyProxy {
        bytes32 addressedId = generateAddressedId(_id, msg.sender);

        if (getPool(_donation.pool) == address(0)) revert PoolNotFound();

        if (donations[addressedId].donor != address(0)) revert Exists();

        donations[addressedId] = _donation;

        emit DonationRegistered(
            _donation.pool,
            _donation.donor,
            _donation.asset,
            _donation.amount
        );
    }

    // -----------------------------------------------------------------
    // Acess Controlled External API (Contracts)
    // -----------------------------------------------------------------

    // @inheritdoc IRegistry
    function register(
        bytes32 _name,
        address _address
    ) public restricted onlyProxy whenNotRegistered(_name) {
        contracts[_name] = _address;

        emit ContractRegistered(_name, _address);
    }

    // @inheritdoc IRegistry
    function batchRegister(
        bytes32[] memory _name,
        address[] memory _address
    ) public onlyProxy restricted {
        uint256 length = _name.length;

        if (length != _address.length) revert LengthMismatch();

        unchecked {
            for (uint256 i; i < length; i++) {
                if (contracts[_name[i]] != address(0)) continue;
                contracts[_name[i]] = _address[i];

                emit ContractRegistered(_name[i], _address[i]);
            }
        }
    }

    // @inheritdoc IRegistry
    function update(
        bytes32 _name,
        address _address
    ) public onlyProxy restricted whenRegistered(_name) {
        contracts[_name] = _address;

        emit ContractUpdated(_name, _address);
    }

    // @inheritdoc IRegistry
    function batchUpdate(
        bytes32[] memory _name,
        address[] memory _address
    ) public onlyProxy restricted {
        uint256 length = _name.length;

        if (length != _address.length) revert LengthMismatch();

        unchecked {
            for (uint256 i; i < length; i++) {
                if (contracts[_name[i]] == address(0)) continue;
                contracts[_name[i]] = _address[i];

                emit ContractUpdated(_name[i], _address[i]);
            }
        }
    }

    // -----------------------------------------------------------------
    // Internal API
    // -----------------------------------------------------------------

    function _authorizeUpgrade(
        address _implementation
    ) internal override onlyOwner {}

    // -----------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------

    modifier whenRegistered(bytes32 _name) {
        if (contracts[_name] == address(0)) revert NotFound();
        _;
    }

    modifier whenNotRegistered(bytes32 _name) {
        if (contracts[_name] != address(0)) revert Exists();
        _;
    }

    modifier whenPoolIsNotRegistered(bytes32 _id) {
        if (pools[_id] != address(0)) revert Exists();
        _;
    }

    // -----------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------

    event ContractRegistered(bytes32 indexed name, address indexed _address);

    event ContractUpdated(bytes32 indexed name, address indexed _address);

    event PoolRegistered(
        bytes32 indexed id,
        address indexed at,
        string name,
        string description
    );

    event DonationRegistered(
        bytes32 indexed pool,
        address indexed donor,
        address indexed asset,
        uint256 amount
    );
}
