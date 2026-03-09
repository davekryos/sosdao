// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {InsufficientLength} from "../Errors.sol";

library HexStrings {
    bytes16 internal constant ALPHABET = "0123456789abcdef";

    function toHexStringASCII(
        uint256 value,
        uint256 length
    ) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";

        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = ALPHABET[value & 0xf];
            value >>= 4;
        }

        if (value != 0) revert InsufficientLength();

        return string(buffer);
    }

    function toHexStringASCIINoPrefix(
        uint256 value,
        uint256 length
    ) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        for (uint256 i = buffer.length; i > 0; i--) {
            buffer[i - 1] = ALPHABET[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
}
