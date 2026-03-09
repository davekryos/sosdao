// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/manager/IAccessManaged.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/**
 * @title IMint
 * @notice Defines the basic interface for the `Mint` contract.
 */
interface IMint is IAccessManaged, IERC721Metadata {
    /// @notice Initializes the contract with the specified owner, authority, and registry addresses.
    /// @param _owner The address that will be set as the owner of the contract.
    /// @param _authority The address that will manage specific permissions or roles within the contract.
    /// @param _registry The address of a registry contract that this contract interacts with.
    function initialize(
        address _owner,
        address _authority,
        address _registry
    ) external;

    /// @notice Generates an SVG image for a specified token.
    /// @param _tokenId The ID of the token for which to generate the SVG image.
    /// @return string Returns an SVG string for the specified token.
    function SVG(uint256 _tokenId) external view returns (string memory);

    /// @notice Retrieves the URI for a token, which provides metadata about the token.
    /// @param _tokenId The ID of the token for which to retrieve the URI.
    /// @return string Returns the URI as a string that points to the token's metadata.
    function tokenURI(uint256 _tokenId) external view returns (string memory);

    /// @notice Mints a new token to a specified recipient with associated asset and amount.
    /// @param _recipient The address that will receive the newly minted token.
    /// @param _asset The address of the asset tied to the token.
    /// @param _amount The amount of the asset tied to the minted token.
    /// @param _pool The identifier (as a bytes32) of the pool associated with this minting.
    /// @return uint256 Returns the new token ID created by this minting process.
    function mint(
        address _recipient,
        address _asset,
        uint256 _amount,
        bytes32 _pool
    ) external returns (uint256);
}
