// SPDX-License-Identifier: UNLICENSED
//
pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UUPSUpgrade is UUPSUpgradeable {
    function _authorizeUpgrade(address _implementation) internal override {}
}
