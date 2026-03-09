// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract RegistryV2 is UUPSUpgradeable {
    string public NATIVE_ASSET_SYMBOL;

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _symbol) external reinitializer(2) {
        __UUPSUpgradeable_init();
        NATIVE_ASSET_SYMBOL = _symbol;
    }

    function _authorizeUpgrade(address _implementation) internal override {}
}
