// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/IAccessManaged.sol";

interface IConfiguration is IAccessManaged {
    function getFeeTakers() external view returns (address[] memory);

    function isFeeTaker(address _address) external view returns (bool);

    function countFeeTakers() external view returns (uint256);
}
