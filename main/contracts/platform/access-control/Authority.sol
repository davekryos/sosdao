// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract Authority is AccessManager {
    constructor(address _initialAuthority) AccessManager(_initialAuthority) {}
}
