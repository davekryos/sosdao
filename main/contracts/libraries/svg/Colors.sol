// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/Strings.sol";

import {EmptyString} from "../Errors.sol";

library Colors {
    function toHEXColors(
        address _address
    ) internal pure returns (string[] memory) {
        string memory asString = Strings.toHexString(_address);

        string[] memory colors = split(asString);

        uint256 length = colors.length;

        unchecked {
            for (uint256 i; i < length; i++) {
                colors[i] = string.concat("#", colors[i]);
            }
        }

        return colors;
    }

    function split(string memory str) internal pure returns (string[] memory) {
        bytes memory asBytes = bytes(str);

        uint256 length = asBytes.length;

        if (length <= 0) revert EmptyString();

        uint256 lines = (length - 1) / 6 + 1;

        string[] memory strLines = new string[](lines);

        bytes memory bytesLines = new bytes(6);

        unchecked {
            for (uint256 i; i < length; ++i) {
                if (i > 0 && i % 6 == 0) {
                    strLines[i / 6 - 1] = string(bytesLines);
                    bytesLines = new bytes(6);
                }
                bytes1 character = asBytes[i];
                bytesLines[i % 6] = character;
            }
        }

        strLines[lines - 1] = string(bytesLines);

        return strLines;
    }
}
