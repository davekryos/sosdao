// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

library Roles {
    bytes32 public constant REQUEST_ROLE = keccak256("REQUEST_ROLE");
    bytes32 public constant APPROVE_ROLE = keccak256("APPROVE_ROLE");
    bytes32 public constant FINALIZE_ROLE = keccak256("FINALIZE_ROLE");
    bytes32 public constant EXECUTE_ROLE = keccak256("EXECUTE_ROLE");
}
