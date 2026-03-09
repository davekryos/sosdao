//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "../platform/registry/Registered.sol";

contract IsRegistered is Registered {
    constructor(address _registry) Registered(_registry) {}

    function getRegistry() external view returns (address) {
        return REGISTRY_ADDRESS;
    }

    function get(bytes32 _name) external view returns (address) {
        return _getAddress(_name);
    }

    function setRegistry(address _address) external {
        return _setRegistry(_address);
    }
}
