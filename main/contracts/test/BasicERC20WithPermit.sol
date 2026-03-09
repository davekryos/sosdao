//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract BasicERC20WithPermit is ERC20, ERC20Permit {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialBalance
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        _mint(msg.sender, _initialBalance);
    }
}
