// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ThreadVoting.sol";

contract ThreadFactory is Ownable {
    mapping(bytes32 hashkey => address thread) private _threadRegistries;

    event ThreadVotingCreated(
        address indexed threadVotingAddress,
        address indexed creator,
        address indexed implementation
    );

    constructor() Ownable(msg.sender) {}

    function createThread(
        address _implementation,
        address _governanceToken,
        string calldata _description,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyOwner returns (address) {
        bytes32 salt = keccak256(
            abi.encode(_implementation, _description, _startTime, _endTime)
        );
        require(
            _threadRegistries[salt] == address(0),
            "Thread is deployed already."
        );

        address thread = Clones.cloneDeterministic(_implementation, salt);

        ThreadVoting(thread).initialize(
            msg.sender,
            _governanceToken,
            _description,
            _startTime,
            _endTime
        );
        _threadRegistries[salt] = thread;

        emit ThreadVotingCreated(thread, msg.sender, _implementation);
        return thread;
    }
}
