// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IVault} from "../../interfaces/IVault.sol";

import {Signature, Transaction, VaultParameters} from "../../libraries/Data.sol";
import {AlreadySet, AlreadyExecuted, AlreadySigned, NotOwner, NotPool, NotEnoughSignatures, UpgradeNotApproved, UpgradeNotTargeted, UpgradeTargetMismatch} from "../../libraries/Errors.sol";

import {VaultLogic} from "../../libraries/logic/VaultLogic.sol";
import {FeeLogic} from "../../libraries/logic/FeeLogic.sol";

contract Vault is IVault, ReentrancyGuard, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address private pool;
    address[] private owners;
    mapping(address => bool) private mOwners;

    mapping(uint256 => mapping(address => bool)) private txSignatures;

    EnumerableSet.AddressSet private upgradeSignatures;
    address private upgradeTarget;

    // Holds balance of assets.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => uint256) private balance;

    // Holds balance of assets of account.
    // Address is either ERC20 address or Zero Address for native.
    mapping(address => mapping(address => uint256)) private balanceOf;

    uint256 private threshold;

    mapping(uint256 => Transaction) private transactions;

    uint256[50] private __gap;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _poolAddress,
        VaultParameters memory _parameters
    ) external initializer {
        __UUPSUpgradeable_init();
        _setPool(_poolAddress);
        _setOwners(_parameters);
    }

    // -----------------------------------------------------------------
    // External API
    // -----------------------------------------------------------------

    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /// @notice Fallback function to receive native.
    receive() external payable virtual {}

    /// @inheritdoc IVault
    function depositNative(
        address _address
    ) external payable onlyPool nonReentrant {
        _adjustBalance(_address, address(0), msg.value);

        emit Deposited(_address, address(0), msg.value);
    }

    /// @inheritdoc IVault
    function depositERC20WithPermit(
        address _token,
        address _from,
        uint256 _value,
        uint256 _deadline,
        uint8 _permitV,
        bytes32 _permitR,
        bytes32 _permitS
    ) external onlyPool nonReentrant {
        try
            IERC20Permit(_token).permit(
                _from,
                address(this),
                _value,
                _deadline,
                _permitV,
                _permitR,
                _permitS
            )
        {} catch {
            revert("Deposit with permit failed.");
        }

        _depositERC20(_token, _from, _value);
    }

    /// @inheritdoc IVault
    function depositERC20(
        address _token,
        address _from,
        uint256 _value
    ) external onlyPool nonReentrant {
        _depositERC20(_token, _from, _value);
    }

    /// @inheritdoc IVault
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @inheritdoc IVault
    function getNativeBalanceOf(
        address _address
    ) external view returns (uint256) {
        return balanceOf[address(0)][_address];
    }

    /// @inheritdoc IVault
    function getERC20Balance(address _token) external view returns (uint256) {
        return balance[_token];
    }

    /// @inheritdoc IVault
    function getERC20BalanceOf(
        address _token,
        address _address
    ) external view returns (uint256) {
        return balanceOf[_token][_address];
    }

    /// @inheritdoc IVault
    function isOwner(address _address) external view returns (bool) {
        return _isOwner(_address);
    }

    /// @inheritdoc IVault
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /// @inheritdoc IVault
    function getThreshold() external view returns (uint256) {
        return threshold;
    }

    /// @inheritdoc IVault
    function getTX(uint256 _index) external view returns (Transaction memory) {
        return _getTX(_index);
    }

    /// @inheritdoc IVault
    function submitTX(
        uint256 _id,
        address _token,
        address _to,
        uint256 _value,
        address _submitter
    ) external onlyPool nonReentrant {
        return _submitTX(_id, _token, _to, _value, _submitter);
    }

    /// @inheritdoc IVault
    function signTX(
        uint256 _id,
        address _signer
    ) external onlyPool nonReentrant {
        return _signTX(_id, _signer);
    }

    /// @inheritdoc IVault
    function executeTX(
        uint256 _id,
        address _executor,
        uint24 _feeRatio,
        address[] memory _feeTakers
    ) external onlyPool nonReentrant {
        return _executeTX(_id, _executor, _feeRatio, _feeTakers);
    }

    /// @inheritdoc IVault
    function isTXExecutable(uint256 _id) external view returns (bool) {
        return _isTXExecutable(_id);
    }

    /// @inheritdoc IVault
    function hasSigned(
        uint256 _id,
        address _address
    ) external view returns (bool) {
        return txSignatures[_id][_address];
    }

    /// @inheritdoc IVault
    function setUpgradeTarget(address _target) public onlyOwners {
        if (_target == address(0)) revert UpgradeTargetMismatch();

        _clearUpgradeSignatures();
        upgradeTarget = _target;
    }

    /// @inheritdoc IVault
    function approveUpgradeTarget(address _target) public onlyOwners {
        if (_target != upgradeTarget) revert UpgradeTargetMismatch();
        if (upgradeSignatures.contains(msg.sender)) revert AlreadySigned();

        upgradeSignatures.add(msg.sender);
    }

    /// @inheritdoc IVault
    function getUpgradeTarget() external view returns (address) {
        return upgradeTarget;
    }

    /// @inheritdoc IVault
    function getUpgradeSignatures() external view returns (address[] memory) {
        return upgradeSignatures.values();
    }

    /// @inheritdoc IVault
    function hasApprovedUpgrade(address _address) external view returns (bool) {
        return upgradeSignatures.contains(_address);
    }

    // -----------------------------------------------------------------
    // Internal API
    // -----------------------------------------------------------------

    function _authorizeUpgrade(
        address _implementation
    ) internal override onlyOwners whenUpgradeTargeted whenUpgradeApproved {
        if (_implementation != upgradeTarget) revert UpgradeTargetMismatch();
        _clearUpgradeSignatures();
        upgradeTarget = address(0);
    }

    /// @dev Internal function to deposit ERC20 tokens.
    function _depositERC20(
        address _token,
        address _from,
        uint256 _value
    ) internal {
        SafeERC20.safeTransferFrom(
            IERC20(_token),
            _from,
            address(this),
            _value
        );

        _adjustBalance(_from, _token, _value);

        emit Deposited(_from, _token, _value);
    }

    /// @dev Internal function to retrieev a transaction.
    function _getTX(
        uint256 _index
    ) internal view returns (Transaction storage) {
        return transactions[_index];
    }

    /// @dev Internal function to create a new transaction.
    function _createTx(
        uint256 _id,
        address _token,
        address _to,
        uint256 _value
    ) internal {
        // assign new transaction to the storage location
        Transaction storage transaction = transactions[_id];

        transaction.id = _id;
        transaction.token = _token;
        transaction.to = _to;
        transaction.value = _value;
    }

    /// @dev Internal function to submit a new transaction.
    function _submitTX(
        uint256 _id,
        address _token,
        address _to,
        uint256 _value,
        address _submitter
    ) internal {
        _createTx(_id, _token, _to, _value);

        emit TXSubmitted(_id, _submitter, transactions[_id]);
    }

    /// @dev Internal function to sign a transaction.
    function _signTX(uint256 _id, address _signer) internal {
        if (!mOwners[_signer]) revert NotOwner();
        if (txSignatures[_id][_signer]) revert AlreadySigned();

        Transaction storage transaction = _getTX(_id);

        if (transaction.signatures.length >= threshold) revert AlreadySigned();

        transaction.signatures.push(Signature({by: _signer}));
        txSignatures[_id][_signer] = true;

        emit TXSigned(_id, _signer, transaction);
    }

    /// @dev Internal function to execute a transaction.
    function _executeTX(
        uint256 _id,
        address _executor,
        uint24 _feeRatio,
        address[] memory _feeTakers
    ) internal {
        if (!mOwners[_executor]) revert NotOwner();
        Transaction storage transaction = _getTX(_id);

        if (transaction.signatures.length < threshold)
            revert NotEnoughSignatures();

        if (transaction.executed) revert AlreadyExecuted();

        transaction.executed = true;

        uint256 count = _feeTakers.length;

        uint256 totalFee = FeeLogic.calculateTotalFee(
            transaction.value,
            _feeRatio
        );

        uint256 feePerTaker = FeeLogic.calculateFeePerTaker(totalFee, count);

        uint256 transferValue = transaction.value - totalFee;

        if (transaction.token == address(0)) {
            _executeNative(transaction.to, transferValue);

            if (feePerTaker > 0) {
                for (uint256 i; i < count; i++) {
                    _executeNative(_feeTakers[i], feePerTaker);
                }
            }
        } else {
            _executeERC20(transaction.token, transaction.to, transferValue);

            if (feePerTaker > 0) {
                for (uint256 i; i < count; i++) {
                    _executeERC20(
                        transaction.token,
                        _feeTakers[i],
                        feePerTaker
                    );
                }
            }
        }

        emit TXExecuted(_id, _executor, transaction);
    }

    /// @dev Internal function to execute a native transfer.
    function _executeNative(address _to, uint256 _value) internal {
        Address.sendValue(payable(_to), _value);
    }

    /// @dev Internal function to execute an ERC20 token transfer.
    function _executeERC20(
        address _token,
        address _to,
        uint256 _value
    ) internal {
        SafeERC20.safeTransfer(IERC20(_token), _to, _value);
    }

    /// @dev Internal function to check if a transaction is executable.
    function _isTXExecutable(uint256 _index) internal view returns (bool) {
        Transaction storage transaction = _getTX(_index);

        return
            !transaction.executed && transaction.signatures.length == threshold;
    }

    /// @dev Internal function to adjust balance post-deposit.
    function _adjustBalance(
        address _address,
        address _token,
        uint256 _value
    ) internal {
        balance[_token] += _value;
        balanceOf[_token][_address] += _value;
    }

    /// @dev Internal function to check if an address is in owners.
    function _isOwner(address _address) internal view returns (bool) {
        return mOwners[_address];
    }

    /// @dev Internal function to set the initial owners and threshold.
    //       It will revert if owners are already set.
    function _setOwners(VaultParameters memory _parameters) internal {
        if (owners.length > 0) revert AlreadySet();

        VaultLogic.checkThreshold(_parameters);

        owners = _parameters.owners;
        threshold = _parameters.threshold;

        uint256 length = owners.length;
        unchecked {
            for (uint256 i; i < length; i++) {
                mOwners[owners[i]] = true;
            }
        }
    }

    /// @dev Internal function to check if the address belongs to the deploying pool
    function _isPool(address _address) internal view returns (bool) {
        return _address == pool;
    }

    /// @dev Internal function to set the pool. Will revert if already set.
    function _setPool(address _pool) internal {
        if (pool != address(0)) revert AlreadySet();

        pool = _pool;
    }

    /// @dev Internal function to clear upgrade signatures.
    function _clearUpgradeSignatures() internal {
        address[] memory values = upgradeSignatures.values();

        for (uint256 i = 0; i < values.length; i++) {
            upgradeSignatures.remove(values[i]);
        }
    }

    // -----------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------

    modifier onlyOwners() {
        if (!_isOwner(msg.sender)) revert NotOwner();
        _;
    }

    modifier onlyPool() {
        if (!_isPool(msg.sender)) revert NotPool();
        _;
    }

    modifier whenUpgradeTargeted() {
        if (upgradeTarget == address(0)) revert UpgradeNotTargeted();
        _;
    }

    modifier whenUpgradeApproved() {
        if (owners.length != upgradeSignatures.length())
            revert UpgradeNotApproved();
        _;
    }

    // -----------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------

    event Deposited(
        address indexed depositor,
        address indexed token,
        uint256 value
    );

    event TXSubmitted(
        uint256 indexed index,
        address indexed submitter,
        Transaction transaction
    );

    event TXSigned(
        uint256 indexed index,
        address indexed signer,
        Transaction transaction
    );

    event TXExecuted(
        uint256 indexed index,
        address indexed executor,
        Transaction transaction
    );
}
