// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IConfiguration} from "../interfaces/IConfiguration.sol";
import {Registered} from "./registry/Registered.sol";

contract Configuration is IConfiguration, AccessManaged, Registered {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private feeTakers;

    constructor(
        address _authority,
        address _registry
    ) AccessManaged(_authority) Registered(_registry) {}

    // -----------------------------------------------------------------
    // External
    // -----------------------------------------------------------------

    function getFeeTakers() public view returns (address[] memory) {
        return feeTakers.values();
    }

    function isFeeTaker(address _address) public view returns (bool) {
        return feeTakers.contains(_address);
    }

    function countFeeTakers() public view returns (uint256) {
        return feeTakers.length();
    }

    // -----------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------

    function addFeeTaker(address _address) external restricted {
        feeTakers.add(_address);
    }

    function removeFeeTaker(address _address) external restricted {
        feeTakers.remove(_address);
    }
}
