// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ThreadVoting is Initializable, OwnableUpgradeable {
    IERC20 public governanceToken;
    string public description;
    uint256 public startTime;
    uint256 public endTime;

    struct Proposal {
        address proposer;
        string description;
        uint256 totalVotes;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => uint256)) public userVotes;
    uint256 public proposalCount;
    uint256 public winningProposal;
    uint256 public totalBalance;

    mapping(address => bool) public userClaimed;

    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string description
    );
    event Voted(uint256 indexed proposalId, address voter, uint256 amount);
    event TokensWithdrawn(
        uint256 indexed proposalId,
        address voter,
        uint256 amount
    );

    function initialize(
        address _governanceToken,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) public initializer {
        __Ownable_init(msg.sender);
        governanceToken = IERC20(_governanceToken);
        description = _description;
        startTime = _startTime;
        endTime = _endTime;
    }

    function _checkCreateProposalPermission(
        address user
    ) private pure returns (bool) {
        // TODO: Check user has create proposal permission
        return user != address(0);
    }

    function createProposal(string memory _description) public {
        require(_checkCreateProposalPermission(msg.sender), "User does not have permission");

        proposalCount++;
        proposals[proposalCount] = Proposal({
            proposer: msg.sender,
            description: _description,
            totalVotes: 0
        });

        emit ProposalCreated(proposalCount, msg.sender, _description);
    }

    function vote(uint256 _proposalId, uint256 _amount) public {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Proposal does not exist");
        require(block.timestamp >= startTime, "Voting period not started");
        require(block.timestamp < endTime, "Voting period has ended");
        require(_amount > 0, "Must vote with at least 1 token");
        require(
            governanceToken.balanceOf(msg.sender) >= _amount,
            "Insufficient tokens"
        );

        governanceToken.transferFrom(msg.sender, address(this), _amount);
        Proposal storage proposal = proposals[_proposalId];

        userVotes[_proposalId][msg.sender] += _amount;
        proposal.totalVotes += _amount;
        totalBalance += _amount;

        emit Voted(_proposalId, msg.sender, _amount);
    }

    function finishVotingPeriod() public onlyOwner returns (uint256) {
        require(winningProposal == 0, "Thread was ended");

        if (block.timestamp < endTime) endTime = block.timestamp;
        if (proposalCount == 0) return 0; // No proposals to execute

        uint256 highestVotes = 0;

        for (uint256 i = 1; i <= proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            if (proposal.totalVotes > highestVotes) {
                winningProposal = i;
                highestVotes = proposal.totalVotes;
            }
        }

        return winningProposal;
    }

    function withdrawTokens() public {
        require(userClaimed[msg.sender] == false, "Tokens have already been withdrawn");
        require(block.timestamp > endTime, "Voting period not ended");
        require(winningProposal > 0, "Thread not ended or no winning proposal");

        uint256 claimAmount = 0;
        // check if user is proposer => claim 10% of total votes
        for (uint256 i = 1; i <= proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            if (proposal.proposer == msg.sender) {
                claimAmount += proposal.totalVotes / 10;
            }
        }

        // check if user voted to winning proposal => claim by percentage of total votes
        uint256 voteAmount = userVotes[winningProposal][msg.sender];
        if (claimAmount == 0) {
            // user is neither proposer nor voted to winning proposal
            require(voteAmount > 0, "User not voted to winning proposal");
        }

        if (voteAmount > 0) {
            claimAmount +=
                (voteAmount * ((totalBalance * 9) / 10)) /
                proposals[winningProposal].totalVotes;
        }

        governanceToken.transfer(msg.sender, claimAmount);
        emit TokensWithdrawn(winningProposal, msg.sender, claimAmount);
        
        userClaimed[msg.sender] = true;
    }

    function getProposal(
        uint256 _proposalId
    ) public view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getUserVote(
        uint256 _proposalId,
        address _voter
    ) public view returns (uint256) {
        return userVotes[_proposalId][_voter];
    }
}
