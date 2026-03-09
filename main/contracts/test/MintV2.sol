// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract MintV2 is ERC721Upgradeable, UUPSUpgradeable {
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol
    ) external reinitializer(2) {
        __ERC721_init(name, symbol);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address _implementation) internal override {}
}
