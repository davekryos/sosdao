// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {IConfiguration} from "../../interfaces/IConfiguration.sol";
import {IPool} from "../../interfaces/IPool.sol";
import {IRegistry} from "../../interfaces/IRegistry.sol";
import {IMint} from "../../interfaces/IMint.sol";

import {Vault} from "./Vault.sol";

import {Request, PoolParameters, VaultParameters} from "../../libraries/Data.sol";
import {AssetNotSupported, NotAuthorized} from "../../libraries/Errors.sol";

// Master Pool Contract
// PoolManager create clones of this contract.
contract Pool is IPool, Initializable {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant MINT_CONTRACT = "MINT";
    bytes32 internal constant CONFIGURATION = "CONFIGURATION";
    bytes32 internal constant REQUEST_MANAGER = "REQUEST_MANAGER";

    address internal registry;
    address internal vaultImplementation;

    bytes32 public id;

    // divided by 1e4 -- ex: 2000 = 20%
    uint24 public feeRatio;

    uint256 public version;

    string public name;

    Vault internal vault;
    EnumerableSet.AddressSet internal assets;

    // Holds total of donations.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => uint256) internal donations;

    // Holds total of donations by donator.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => mapping(address => uint256)) internal donationsOf;

    uint256[50] private __gap;

    constructor() {
        _disableInitializers();
    }

    /// @inheritdoc IPool
    function initialize(
        address _registry,
        uint256 _version,
        bytes32 _id,
        address _vaultImplementation,
        PoolParameters calldata _parameters
    ) external initializer {
        registry = _registry;
        version = _version;
        id = _id;
        name = _parameters.name;
        vaultImplementation = _vaultImplementation;

        feeRatio = _parameters.feeRatio;

        _deployVault(_parameters.vaultParameters);

        uint256 length = _parameters.permittedAssets.length;

        unchecked {
            for (uint256 i; i < length; i++) {
                assets.add(_parameters.permittedAssets[i]);
            }
        }
    }

    // -----------------------------------------------------------------
    // External API (Configuration)
    // -----------------------------------------------------------------

    // Token Configuration

    function enableAsset(address _address) external onlyOwners {
        assets.add(_address);

        emit AssetEnabled(_address);
    }

    function disableAsset(address _address) external onlyOwners {
        assets.remove(_address);

        emit AssetDisabled(_address);
    }

    function getEnabledAssets() external view returns (address[] memory) {
        return assets.values();
    }

    function isAssetEnabled(address _address) external view returns (bool) {
        return assets.contains(_address);
    }

    // -----------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------

    modifier onlyOwners() {
        bool isOwner = vault.isOwner(msg.sender);

        if (!isOwner) revert NotAuthorized();

        _;
    }

    // -----------------------------------------------------------------
    // External API (Deposits)
    // -----------------------------------------------------------------

    /// @inheritdoc IPool
    function getVaultAddress() external view returns (address) {
        return _getVaultAddress();
    }

    /// @inheritdoc IPool
    function depositNative() external payable {
        if (!assets.contains(address(0))) revert AssetNotSupported();

        vault.depositNative{value: msg.value}(msg.sender);

        donations[address(0)] += msg.value;
        donationsOf[address(0)][msg.sender] += msg.value;

        _mint(msg.sender, address(0), msg.value);
    }

    /// @inheritdoc IPool
    function depositERC20WithPermit(
        address _token,
        uint256 _value,
        uint256 _deadline,
        uint8 _permitV,
        bytes32 _permitR,
        bytes32 _permitS
    ) external {
        if (!assets.contains(_token)) revert AssetNotSupported();

        vault.depositERC20WithPermit(
            _token,
            msg.sender,
            _value,
            _deadline,
            _permitV,
            _permitR,
            _permitS
        );

        donations[_token] += _value;
        donationsOf[_token][msg.sender] += _value;

        _mint(msg.sender, _token, _value);
    }

    /// @inheritdoc IPool
    function depositERC20(address _token, uint256 _value) external {
        if (!assets.contains(_token)) revert AssetNotSupported();

        vault.depositERC20(_token, msg.sender, _value);

        donations[_token] += _value;
        donationsOf[_token][msg.sender] += _value;

        _mint(msg.sender, _token, _value);
    }

    /// @inheritdoc IPool
    function getNativeBalance() external view returns (uint256) {
        return vault.getNativeBalance();
    }

    /// @inheritdoc IPool
    function getNativeBalanceOf(
        address _address
    ) external view returns (uint256) {
        return vault.getNativeBalanceOf(_address);
    }

    /// @inheritdoc IPool
    function getERC20Balance(address _token) external view returns (uint256) {
        return vault.getERC20Balance(_token);
    }

    /// @inheritdoc IPool
    function getERC20BalanceOf(
        address _token,
        address _address
    ) external view returns (uint256) {
        return vault.getERC20BalanceOf(_token, _address);
    }

    /// @inheritdoc IPool
    function submitTX(
        Request calldata _request,
        address _submitter
    ) public onlyRequestManager {
        vault.submitTX(
            _request.id,
            _request.token,
            _request.recipient,
            _request.value,
            _submitter
        );

        emit TXSubmitted(_request.id, _submitter, _request);
    }

    /// @inheritdoc IPool
    function signTX(
        Request calldata _request,
        address _signer
    ) public onlyRequestManager {
        vault.signTX(_request.id, _signer);

        emit TXSigned(_request.id, _signer, _request);
    }

    /// @inheritdoc IPool
    function executeTX(
        Request calldata _request,
        address _executor
    ) public onlyRequestManager {
        IConfiguration configuration = _getConfiguration();
        address[] memory feeTakers = configuration.getFeeTakers();

        vault.executeTX(_request.id, _executor, feeRatio, feeTakers);

        emit TXExecuted(_request.id, _executor, _request);
    }

    /// @inheritdoc IPool
    function isTXExecutable(
        Request calldata _request
    ) public view returns (bool) {
        return vault.isTXExecutable(_request.id);
    }

    // -----------------------------------------------------------------
    // Internal API
    // -----------------------------------------------------------------

    function _deployVault(VaultParameters memory _parameters) internal {
        ERC1967Proxy vaultProxy = new ERC1967Proxy(
            vaultImplementation,
            abi.encodeCall(Vault.initialize, (address(this), _parameters))
        );

        vault = Vault(payable(vaultProxy));

        emit VaultDeployed(payable(vaultProxy), address(this));
    }

    function _mint(
        address _recipient,
        address _asset,
        uint256 _amount
    ) internal {
        address minter = _getMinterAddress();

        IMint(minter).mint(_recipient, _asset, _amount, id);

        emit Minted(_recipient, _asset, _amount);
    }

    function _getMinterAddress() internal view returns (address) {
        return IRegistry(registry).get(MINT_CONTRACT);
    }

    function _getConfiguration() internal view returns (IConfiguration) {
        return IConfiguration(IRegistry(registry).get(CONFIGURATION));
    }

    function _getVaultAddress() internal view returns (address) {
        return address(vault);
    }

    // -----------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------

    modifier onlyRequestManager() {
        address requestManager = IRegistry(registry).get(REQUEST_MANAGER);
        if (msg.sender != requestManager) revert NotAuthorized();

        _;
    }

    // -----------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------

    event VaultDeployed(address indexed at, address indexed pool);

    event AssetEnabled(address indexed asset);

    event AssetDisabled(address indexed asset);

    event TXSubmitted(
        uint256 indexed index,
        address indexed submitter,
        Request transaction
    );

    event TXSigned(
        uint256 indexed index,
        address indexed signer,
        Request transaction
    );

    event TXExecuted(
        uint256 indexed index,
        address indexed executor,
        Request transaction
    );

    event Minted(
        address indexed recipient,
        address indexed asset,
        uint256 amount
    );
}
