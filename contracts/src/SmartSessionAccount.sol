// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract SmartSessionAccount {
    address public immutable owner;
    uint256 public nonce;
    mapping(address => bool) public allowedTargets;

    struct Session {
        uint64 expiresAt;
        bool active;
    }

    mapping(address => Session) public sessions;

    event SessionEnabled(address indexed key, uint64 expiresAt);
    event SessionRevoked(address indexed key);
    event Executed(address indexed caller, address indexed to, uint256 value, bytes data, bytes result);
    event ContractDeployed(address indexed deployed, uint256 value);

    error NotOwner();
    error NotAuthorized();
    error TargetNotAllowed();
    error CallFailed(bytes result);
    error Expired();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address owner_) payable {
        require(owner_ != address(0), "OWNER");
        owner = owner_;
    }

    receive() external payable {}

    function setAllowedTarget(address target, bool allowed) external onlyOwner {
        allowedTargets[target] = allowed;
    }

    function enableSession(address key, uint64 expiresAt) external onlyOwner {
        if (expiresAt <= block.timestamp) revert Expired();
        require(key != address(0), "KEY");
        sessions[key] = Session({expiresAt: expiresAt, active: true});
        emit SessionEnabled(key, expiresAt);
    }

    function revokeSession(address key) external onlyOwner {
        delete sessions[key];
        emit SessionRevoked(key);
    }

    function isSessionActive(address key) external view returns (bool) {
        Session memory session = sessions[key];
        return session.active && session.expiresAt > block.timestamp;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory result) {
        _authorize();
        if (msg.sender != owner && !allowedTargets[to]) revert TargetNotAllowed();
        nonce++;
        (bool ok, bytes memory response) = to.call{value: value}(data);
        if (!ok) revert CallFailed(response);
        emit Executed(msg.sender, to, value, data, response);
        return response;
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads
    ) external returns (bytes[] memory results) {
        _authorize();
        require(targets.length == values.length && targets.length == payloads.length, "LENGTH");
        nonce++;
        results = new bytes[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            if (msg.sender != owner && !allowedTargets[targets[i]]) revert TargetNotAllowed();
            (bool ok, bytes memory response) = targets[i].call{value: values[i]}(payloads[i]);
            if (!ok) revert CallFailed(response);
            results[i] = response;
            emit Executed(msg.sender, targets[i], values[i], payloads[i], response);
        }
    }

    function deploy(bytes calldata initCode, uint256 value) external returns (address deployed) {
        _authorize();
        nonce++;
        bytes memory code = initCode;
        assembly {
            deployed := create(value, add(code, 0x20), mload(code))
        }
        require(deployed != address(0), "DEPLOY");
        emit ContractDeployed(deployed, value);
    }

    function _authorize() internal view {
        if (msg.sender == owner) return;
        Session memory session = sessions[msg.sender];
        if (!session.active || session.expiresAt <= block.timestamp) revert NotAuthorized();
    }
}
