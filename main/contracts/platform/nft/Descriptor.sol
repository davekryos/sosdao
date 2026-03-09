// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {SVG} from "../../libraries/svg/SVG.sol";
import {JSON} from "../../libraries/svg/JSON.sol";

contract Descriptor {
    using Strings for uint256;

    // -----------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------

    function _encode(bytes memory _svg) internal pure returns (string memory) {
        return _base64(_svg);
    }

    function _buildSVG(
        uint256 _tokenId,
        address _ownerAddress,
        string memory _symbol,
        uint256 _amount,
        uint256 _decimals,
        string memory _name
    ) internal pure returns (bytes memory) {
        string memory supportAmount = SVG.formatted(_amount, _decimals, 5);

        bytes memory dynamicLayer = abi.encodePacked(
            SVG.sideText(
                _tokenId.toString(),
                "rotate(90 132.5 142.5)",
                "start"
            ),
            SVG.sideText(
                Strings.toHexString(_ownerAddress),
                "rotate(90 -107.5 382.5)",
                "end"
            ),
            SVG.titleStack(30, 110, "Pool", abi.encodePacked(_name)),
            SVG.titleStack(
                30,
                200,
                "Donation",
                abi.encodePacked(supportAmount, " ", _symbol)
            )
        );

        string memory gradient = SVG.gradient(["#091D53", "#157C83"]);

        return
            abi.encodePacked(
                '<svg width="290" height="500" viewBox="0 0 290 500" xmlns="http://www.w3.org/2000/svg">',
                STYLE,
                BACKGROUND,
                SIDEBOX,
                LOGO,
                dynamicLayer,
                gradient,
                "</svg>"
            );
    }

    function _toDataURI(
        string memory image
    ) internal pure returns (string memory) {
        string[3] memory keys = ["name", "description", "image"];

        string[3] memory values = [
            "SOS DAO",
            "SOS DAO Donation NFT",
            string.concat("data:image/svg+xml;base64,", image)
        ];

        return JSON.toJSON(keys, values);
    }

    function _base64(bytes memory data) internal pure returns (string memory) {
        return Base64.encode(data);
    }

    // -----------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------

    bytes internal constant STYLE =
        // solhint-disable-next-line max-line-length
        "<style><![CDATA[text{font-family:Arial;font-weight:100}.alpha{opacity:0.5}.small{font-size:.8rem}.large{font-size:1.4rem}.huge{font-size:2rem}.title{fill:#fff}.bold{font-weight:bold}]]></style>";

    bytes internal constant LOGO =
        // solhint-disable-next-line max-line-length
        '<text class="title huge" fill="#FFF" transform="translate(30,60)"> <tspan class="bold">SOS</tspan><tspan class="alpha">DAO</tspan></text>';

    bytes internal constant BACKGROUND =
        // solhint-disable-next-line max-line-length
        '<path fill="url(#gradient)" d="M0 20 A 20 20 0 0 1 20 0 L 270 0 A 0 0 0 0 1 270 0 L 270 500 A 0 0 0 0 1 270 500 L 20 500 A 20 20 0 0 1 0 480 Z" />';

    bytes internal constant SIDEBOX =
        '<path fill="#EC5728" d="M270 0h20v500h-20z" />';
}
