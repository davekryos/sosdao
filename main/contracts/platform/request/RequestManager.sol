//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.23;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import {Pool} from "../pool/Pool.sol";
import {RegisteredUpgradeable} from "../registry/RegisteredUpgradeable.sol";

import {Request, Status} from "../../libraries/Data.sol";
import {MustBeGreaterThanZero, InsufficientBalance, NotAllowed, NotAuthorized} from "../../libraries/Errors.sol";

import {IVault} from "../../interfaces/IVault.sol";

contract RequestManager is
    OwnableUpgradeable,
    UUPSUpgradeable,
    RegisteredUpgradeable
{
    Request[] private requests;
    mapping(bytes32 => uint256[]) internal idsByPool;
    mapping(address => uint256[]) internal idsByAddress;

    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with owner and registry addresses.
    /// @param _owner The address that will be set as the owner of the contract.
    /// @param _registry The address of a registry contract that this contract interacts with.
    function initialize(
        address _owner,
        address _registry
    ) external initializer {
        __Ownable_init(_owner);
        _setRegistry(_registry);
    }

    // -----------------------------------------------------------------
    // Public API (Public)
    // -----------------------------------------------------------------

    /// @notice Creates a new request with the specified details and records it in the contract.
    /// @param _poolId The identifier of the pool associated with this request.
    /// @param _recipient The recipient address for the request.
    /// @param _description A string description of the request.
    /// @param _token The address of the ERC20 token involved in the request.
    /// @param _amount The amount of tokens requested.
    /// @return uint256 Returns the unique ID of the newly created request.
    function create(
        bytes32 _poolId,
        address _recipient,
        string calldata _description,
        address _token,
        uint256 _amount
    ) external returns (uint256) {
        uint256 id = _create(
            _poolId,
            _recipient,
            _description,
            _token,
            _amount
        );

        return id;
    }

    /// @notice Retrieves the status of a specific request by its ID.
    /// @param _requestId The unique ID of the request whose status is being queried.
    /// @return Status Returns the current status of the request.
    function getStatus(uint256 _requestId) external view returns (Status) {
        return requests[_requestId].status;
    }

    /// @notice Counts all requests stored in the contract.
    /// @return uint256 Returns the count of all requests.
    function getRequestCount() external view returns (uint256) {
        return requests.length;
    }

    /// @notice Retrieves all request IDs associated with a specific pool ID.
    /// @param _poolId The pool ID to query request IDs for.
    /// @return uint256[] Returns an array of request IDs associated with the specified pool.
    function getRequestsByPool(
        bytes32 _poolId
    ) external view returns (uint256[] memory) {
        return idsByPool[_poolId];
    }

    /// @notice Retrieves all request IDs associated with a specific address.
    /// @param _address The address to query request IDs for.
    /// @return uint256[] Returns an array of request IDs associated with the specified address.
    function getRequestsByAddress(
        address _address
    ) external view returns (uint256[] memory) {
        return idsByAddress[_address];
    }

    /// @notice Retrieves details of a specific request by its ID.
    /// @param _requestId The unique ID of the request to retrieve.
    /// @return Request Returns the request details corresponding to the specified ID.
    function getRequest(
        uint256 _requestId
    ) external view returns (Request memory) {
        return requests[_requestId];
    }

    /// @notice Retrieves the address of the signer for a specific check within a request.
    /// @param _id The ID of the request.
    /// @param _checkId The specific check within the request to query the signer for.
    /// @return address Returns the address of the signer for the specified check.
    function getSigner(
        uint256 _id,
        uint256 _checkId
    ) external view returns (address) {
        return requests[_id].signatures[_checkId].by;
    }

    // -----------------------------------------------------------------
    // Public API (Restricted)
    // -----------------------------------------------------------------

    /// @notice Approves a request associated with a specific pool, allowing it to be executed.
    /// @param _poolId The identifier of the pool associated with the request.
    /// @param _requestId The unique ID of the request to be approved.
    function approve(
        bytes32 _poolId,
        uint256 _requestId
    ) external onlyOwners(_poolId) {
        _approve(_requestId);
    }

    /// @notice Executes an approved request associated with a specific pool.
    /// @param _poolId The identifier of the pool associated with the request.
    /// @param _requestId The unique ID of the request to be executed.
    function execute(
        bytes32 _poolId,
        uint256 _requestId
    ) external onlyOwners(_poolId) {
        _execute(_poolId, _requestId);
    }

    // -----------------------------------------------------------------
    // Internal API
    // -----------------------------------------------------------------

    function _authorizeUpgrade(
        address _implementation
    ) internal override onlyOwner {}

    function _create(
        bytes32 _poolId,
        address _recipient,
        string calldata _description,
        address _token,
        uint256 _value
    ) internal returns (uint256) {
        if (_value <= 0) revert MustBeGreaterThanZero();

        _checkPoolBalance(_poolId, _token, _value);

        // pre-allocate storage location for the new Request
        uint256 id = requests.length;
        requests.push();
        idsByPool[_poolId].push(id);
        idsByAddress[_recipient].push(id);

        // assign new Request to the storage location
        Request storage request = requests[id];

        request.id = id;
        request.poolId = _poolId;
        request.recipient = _recipient;
        request.token = _token;
        request.value = _value;
        request.status = Status.Pending;
        request.description = _description;

        emit RequestCreated(
            id,
            _poolId,
            _recipient,
            _description,
            _token,
            _value
        );

        Pool pool = _getPool(_poolId);

        pool.submitTX(request, msg.sender);

        return id;
    }

    function _approve(uint256 _requestId) internal {
        Request storage request = requests[_requestId];
        Pool pool = _getPool(request.poolId);

        pool.signTX(request, msg.sender);

        if (pool.isTXExecutable(request)) {
            _bumpStatus(request);
        }
    }

    function _execute(bytes32 _poolId, uint256 _requestId) internal {
        Pool pool = _getPool(_poolId);
        Request storage request = requests[_requestId];

        pool.executeTX(request, msg.sender);

        _bumpStatus(request);
    }

    function _bumpStatus(Request storage _request) internal {
        uint8 status = uint8(_request.status);

        if (status == uint8(type(Status).max)) revert NotAllowed();

        _request.status = Status(status + 1);

        emit StatusChange(_request.id, _request.status);
    }

    function _getPool(bytes32 _poolId) internal view returns (Pool) {
        address poolAddress = _getRegistry().getPool(_poolId);

        return Pool(payable(poolAddress));
    }

    function _getVault(bytes32 _poolId) internal view returns (IVault) {
        Pool pool = _getPool(_poolId);

        address vault = pool.getVaultAddress();

        return IVault(payable(vault));
    }

    function _checkPoolBalance(
        bytes32 _poolId,
        address _token,
        uint256 _value
    ) internal view {
        Pool pool = _getPool(_poolId);

        uint256 balance;
        if (_token == address(0)) {
            balance = pool.getNativeBalance();
        } else {
            balance = pool.getERC20Balance(_token);
        }

        if (balance < _value) revert InsufficientBalance();
    }

    // -----------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------

    modifier onlyOwners(bytes32 _poolId) {
        IVault vault = _getVault(_poolId);

        bool isOwner = vault.isOwner(msg.sender);

        if (!isOwner) revert NotAuthorized();

        _;
    }

    // -----------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------

    event RequestCreated(
        uint256 indexed id,
        bytes32 indexed poolId,
        address indexed recipient,
        string description,
        address token,
        uint256 amount
    );

    event StatusChange(uint256 indexed id, Status indexed status);
}
