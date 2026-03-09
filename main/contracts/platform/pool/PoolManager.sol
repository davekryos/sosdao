// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "@openzeppelin/contracts/access/manager/IAccessManager.sol";

import {IPoolManager} from "../../interfaces/IPoolManager.sol";

import {Pool} from "./Pool.sol";
import {Registered} from "../registry/Registered.sol";

import {PoolParameters} from "../../libraries/Data.sol";
import {VaultLogic} from "../../libraries/logic/VaultLogic.sol";

import {Exists} from "../../libraries/Errors.sol";

contract PoolManager is
    IPoolManager,
    AccessManaged,
    Pausable,
    Registered,
    UpgradeableBeacon
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    uint64 internal constant ROLE_ID =
        uint64(uint256(keccak256("MINTER_ROLE")));

    uint256 public version = 1;

    address public vaultImplementation;

    EnumerableSet.AddressSet internal poolAddresses;
    EnumerableSet.Bytes32Set internal poolIds;

    constructor(
        address _authority,
        address _owner,
        address _registry,
        address _poolImplementation,
        address _vaultImplementation
    )
        AccessManaged(_authority)
        Registered(_registry)
        UpgradeableBeacon(_poolImplementation, _owner)
    {
        vaultImplementation = _vaultImplementation;
    }

    function upgradeTo(address _implementation) public override {
        super.upgradeTo(_implementation);

        version++;
    }

    // External API

    // @inheritdoc IPoolManager
    function deployPool(
        PoolParameters memory _parameters
    ) external restricted whenNotPaused {
        VaultLogic.checkThreshold(_parameters.vaultParameters);

        bytes32 id = _calculateId(version, _parameters.name);

        if (_getRegistry().getPool(id) != address(0)) revert Exists();

        address pool = _deployPool(id, version, _parameters);

        IAccessManager(authority()).grantRole(ROLE_ID, pool, 0);

        poolAddresses.add(pool);
        poolIds.add(id);

        _getRegistry().registerPool(
            id,
            pool,
            _parameters.name,
            _parameters.description
        );
    }

    function pause() external restricted {
        return _pause();
    }

    function unpause() external restricted {
        return _unpause();
    }

    // @inheritdoc IPoolManager
    function getPoolAddresses() external view returns (address[] memory) {
        return poolAddresses.values();
    }

    // @inheritdoc IPoolManager
    function getPoolIds() external view returns (bytes32[] memory) {
        return poolIds.values();
    }

    // @inheritdoc IPoolManager
    function getPoolAddressesCount() public view returns (uint256) {
        return poolAddresses.length();
    }

    // @inheritdoc IPoolManager
    function getPoolIdsCount() public view returns (uint256) {
        return poolIds.length();
    }

    // Internal API

    function _calculateId(
        uint256 _version,
        string memory _name
    ) internal view returns (bytes32) {
        return keccak256(abi.encode(address(this), _version, _name));
    }

    function _deployPool(
        bytes32 _id,
        uint256 _version,
        PoolParameters memory _parameters
    ) internal returns (address) {
        BeaconProxy pool = new BeaconProxy(
            address(this),
            abi.encodeCall(
                Pool.initialize,
                (
                    REGISTRY_ADDRESS,
                    _version,
                    _id,
                    vaultImplementation,
                    _parameters
                )
            )
        );

        return payable(pool);
    }
}
