// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

library JSON {
    function toJSON(
        string[3] memory _keys,
        string[3] memory _values
    ) internal pure returns (string memory) {
        string memory dynamic;

        uint256 length = _keys.length;

        unchecked {
            for (uint256 i; i < length; i++) {
                dynamic = string.concat(
                    dynamic,
                    _quote(_keys[i]),
                    ":",
                    _quote(_values[i])
                );

                if (i != _keys.length - 1) {
                    dynamic = string.concat(dynamic, ",");
                }
            }
        }

        return string.concat("{", dynamic, "}");
    }

    function _quote(string memory str) internal pure returns (string memory) {
        return string.concat('"', str, '"');
    }
}
