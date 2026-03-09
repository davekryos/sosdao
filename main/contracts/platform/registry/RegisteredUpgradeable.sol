// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "./Registry.sol";

/**
 * @title RegisteredUpgradeable
 * @dev A contract module which interacts with the Registry contract to manage address mappings.
 * This module is designed to be inherited to provide basic registry access functionality.
 * All contracts accessed via the Registry Contract should inherit this contract.
 */
contract RegisteredUpgradeable {
    address public REGISTRY_ADDRESS;

    uint256[50] private __gap;

    function _getRegistry() internal view returns (Registry) {
        return Registry(REGISTRY_ADDRESS);
    }

    /**
     * @dev Internal function to get an address associated with a registered name.
     * This function queries the Registry contract to retrieve the address.
     *
     * @param _name The registered name as a bytes32 value.
     * @return The address associated with the registered name.
     */
    function _getAddress(bytes32 _name) internal view returns (address) {
        return _getRegistry().get(_name);
    }

    /**
     * @dev Internal function to set the address of the Registry contract.
     * This function updates the address of the Registry contract that this contract interacts with.
     *
     * @param _registry_address The address of the new Registry contract.
     */
    function _setRegistry(address _registry_address) internal {
        REGISTRY_ADDRESS = _registry_address;
    }
}
