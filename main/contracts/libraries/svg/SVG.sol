// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/Strings.sol";

library SVG {
    using Strings for uint256;

    bytes16 internal constant ALPHABET = "0123456789abcdef";

    function formatted(
        uint256 _amount,
        uint256 _decimals,
        uint256 _precision
    ) internal pure returns (string memory) {
        require(_decimals >= _precision, "possible underflow");

        uint256 lExponent = 10 ** _decimals;
        uint256 left = (_amount / lExponent);

        uint256 rExponent = 10 ** (_decimals - _precision);
        uint256 mod = 10 ** _precision;
        uint256 right = (_amount / rExponent) % mod;

        string memory leftStr = left.toString();
        string memory rightStr = right.toString();

        uint256 fill = _precision - bytes(rightStr).length;

        if (fill == 4) return leftStr;

        unchecked {
            for (uint256 i; i < fill; i++) {
                rightStr = string(abi.encodePacked("0", rightStr));
            }
        }

        return string(abi.encodePacked(leftStr, ".", rightStr));
    }

    function gradient(
        string[2] memory _colors
    ) internal pure returns (string memory) {
        return
            string.concat(
                '<defs><linearGradient id="gradient">',
                stopTag(_colors[0], "0%"),
                stopTag(_colors[1], "100%"),
                "</linearGradient></defs>"
            );
    }

    function stopTag(
        string memory _color,
        string memory _offset
    ) internal pure returns (string memory) {
        return
            string.concat(
                '<stop offset="',
                _offset,
                '" stop-color="',
                _color,
                '"></stop>'
            );
    }

    function sideText(
        string memory _text,
        bytes memory _transform,
        bytes memory _anchor
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                '<text class="small" transform="',
                _transform,
                '" style="text-anchor:',
                _anchor,
                '" fill="#FFF">',
                _text,
                "</text>"
            );
    }

    function titleStack(
        uint256 _x,
        uint256 _y,
        bytes memory _sub,
        bytes memory _title
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                '<text class="title" transform="translate(',
                _x.toString(),
                ",",
                _y.toString(),
                ')"><tspan class="alpha" x="0">',
                _sub,
                '</tspan><tspan x="0" dy="30">',
                _title,
                "</tspan></text>"
            );
    }

    function _quote(string memory str) internal pure returns (string memory) {
        return string.concat('"', str, '"');
    }
}
