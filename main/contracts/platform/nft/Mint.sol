// SPDX-License-Identifier: UNLICENSED
//
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/manager/AccessManagedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {IMint} from "../../interfaces/IMint.sol";

import {Donation} from "../../libraries/Data.sol";

import {Descriptor} from "./Descriptor.sol";
import {RegisteredUpgradeable} from "../registry/RegisteredUpgradeable.sol";
import {Pool} from "../pool/Pool.sol";

contract Mint is
    IMint,
    AccessManagedUpgradeable,
    OwnableUpgradeable,
    RegisteredUpgradeable,
    ERC721Upgradeable,
    UUPSUpgradeable,
    Descriptor
{
    uint256 internal tokenId;

    uint256[50] private __gap;

    constructor() {
        _disableInitializers();
    }

    /// @inheritdoc IMint
    function initialize(
        address _owner,
        address _authority,
        address _registry
    ) external initializer {
        __Ownable_init(_owner);
        __AccessManaged_init(_authority);
        __ERC721_init("SOS DAO", "SOSDNT");
        __UUPSUpgradeable_init();
        _setRegistry(_registry);
    }

    // -----------------------------------------------------------------
    // External
    // -----------------------------------------------------------------

    /// @inheritdoc IMint
    function SVG(uint256 _tokenId) external view returns (string memory) {
        Donation memory donation = _getDonation(_tokenId);

        address owner = ownerOf(_tokenId);

        bytes memory svg = _buildSVG(
            _tokenId,
            owner,
            _getAssetSymbol(donation.asset),
            donation.amount,
            _getAssetDecimals(donation.asset),
            _getPoolName(donation.pool)
        );

        return string(svg);
    }

    // -----------------------------------------------------------------
    // Public
    // -----------------------------------------------------------------

    /// @inheritdoc IMint
    function tokenURI(
        uint256 _tokenId
    ) public view override(ERC721Upgradeable, IMint) returns (string memory) {
        Donation memory donation = _getDonation(_tokenId);

        address owner = ownerOf(_tokenId);

        bytes memory svg = _buildSVG(
            _tokenId,
            owner,
            _getAssetSymbol(donation.asset),
            donation.amount,
            _getAssetDecimals(donation.asset),
            _getPoolName(donation.pool)
        );

        string memory image = _encode(svg);

        return _toDataURI(image);
    }

    // -----------------------------------------------------------------
    // Public (Access Managed)
    // -----------------------------------------------------------------

    /// @inheritdoc IMint
    function mint(
        address _recipient,
        address _asset,
        uint256 _amount,
        bytes32 _poolId
    ) public restricted returns (uint256) {
        _safeMint(_recipient, ++tokenId);

        Donation memory donation = Donation({
            donor: _recipient,
            amount: _amount,
            asset: _asset,
            pool: _poolId
        });

        _getRegistry().registerDonation(tokenId, donation);

        return tokenId;
    }

    // -----------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------

    function _authorizeUpgrade(
        address _implementation
    ) internal override onlyOwner {}

    function _getAssetSymbol(
        address _asset
    ) internal view returns (string memory) {
        if (_asset == address(0)) return _getRegistry().NATIVE_ASSET_SYMBOL();
        return IERC20Metadata(_asset).symbol();
    }

    function _getAssetDecimals(address _asset) internal view returns (uint256) {
        if (_asset == address(0)) return 18;
        return IERC20Metadata(_asset).decimals();
    }

    function _getPoolName(bytes32 _id) internal view returns (string memory) {
        return Pool(payable(_getRegistry().getPool(_id))).name();
    }

    function _getDonation(uint256 _id) internal view returns (Donation memory) {
        bytes32 addressedId = keccak256(abi.encode(_id, address(this)));
        return _getRegistry().getDonation(addressedId);
    }
}
