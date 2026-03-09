// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import {PoolParameters} from "../libraries/Data.sol";

/**
 * @title IPoolManager
 * @notice Defines the basic interface for the PoolManager contract.
 */
interface IPoolManager {
    /**
     * @dev Deploys a new pool with the specified name, description, and fee ratio.
     * @param _parameters PoolParameters
     */
    function deployPool(PoolParameters calldata _parameters) external;

    function getPoolAddresses() external view returns (address[] memory);

    function getPoolIds() external view returns (bytes32[] memory);
}
