// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {Signature, Transaction, VaultParameters} from "../libraries/Data.sol";

contract VaultV2 is UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address private pool;
    address[] private owners;
    mapping(address => bool) private mOwners;

    mapping(uint256 => mapping(address => bool)) private txSignatures;

    EnumerableSet.AddressSet private upgradeSignatures;
    address private upgradeTarget;

    // Holds balance of assets.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => uint256) private balance;

    // Holds balance of assets of account.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => mapping(address => uint256)) private balanceOf;

    uint256 private threshold;

    mapping(uint256 => Transaction) private transactions;

    uint256 set;

    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _set) external reinitializer(2) {
        __UUPSUpgradeable_init();
        set = _set;
    }

    function getNativeBalance() external view returns (uint256) {
        return set;
    }

    function _authorizeUpgrade(address _implementation) internal override {}

    function getUpgradeTarget() external view returns (address) {
        return upgradeTarget;
    }

    function getUpgradeSignatures() external view returns (address[] memory) {
        return upgradeSignatures.values();
    }
}
