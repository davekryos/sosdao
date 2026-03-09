// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {VaultParameters} from "../Data.sol";
import {IncorrectThreshold} from "../Errors.sol";

library VaultLogic {
    function checkThreshold(VaultParameters memory _parameters) internal pure {
        if (
            _parameters.threshold == 0 ||
            _parameters.threshold > _parameters.owners.length
        ) revert IncorrectThreshold();
    }
}
