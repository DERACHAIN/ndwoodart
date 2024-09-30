import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ThreadVoting", function () {
  const DESCRIPTION = "description";

  async function deployContract() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const governanceToken = await ethers.deployContract("ERC20", [
      "Test",
      "test",
      18,
    ]);

    const now = await time.latest();
    const threadVoting = await ethers.deployContract("ThreadVoting");
    await threadVoting.initialize(
      governanceToken.target,
      DESCRIPTION,
      now,
      now + 3600 * 24
    );

    console.log("contract created: ", threadVoting.target);

    return { threadVoting, governanceToken, owner, addr1, addr2, now };
  }

  describe("Deployment", function () {
    it("Should set the right governance token and description", async function () {
      const { threadVoting, governanceToken } = await loadFixture(
        deployContract
      );

      expect(await threadVoting.governanceToken()).to.equal(
        governanceToken.target
      );
      expect(await threadVoting.description()).to.equal(DESCRIPTION);
    });
  });

  describe("Proposals", function () {
    it("Should create a proposal", async function () {
      const { threadVoting, addr1 } = await loadFixture(deployContract);

      await threadVoting.connect(addr1).createProposal("Proposal 1");

      const proposal = await threadVoting.getProposal(1);
      expect(proposal.proposer).to.equal(addr1.address);
      expect(proposal.description).to.equal("Proposal 1");
      expect(proposal.totalVotes).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should allow voting on a proposal", async function () {
      const { threadVoting, governanceToken, owner, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 50);

      const proposal = await threadVoting.getProposal(1);
      expect(proposal.totalVotes).to.equal(50);

      const userVote = await threadVoting.getUserVote(1, addr1.address);
      expect(userVote).to.equal(50);
    });

    it("Should allow voting multiple times on a proposal", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 50);
      await threadVoting.connect(addr1).vote(1, 50);

      const proposal = await threadVoting.getProposal(1);
      expect(proposal.totalVotes).to.equal(100);

      const userVote = await threadVoting.getUserVote(1, addr1.address);
      expect(userVote).to.equal(100);
    });

    it("Should not allow voting with insufficient tokens", async function () {
      const { threadVoting, addr1 } = await loadFixture(deployContract);

      await threadVoting.connect(addr1).createProposal("Proposal 1");

      await expect(threadVoting.connect(addr1).vote(1, 50)).to.be.revertedWith(
        "Insufficient tokens"
      );
    });

    it("Should not allow voting on a non-existing proposal", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await expect(threadVoting.connect(addr1).vote(1, 50)).to.be.revertedWith(
        "Proposal does not exist"
      );
    });

    it("Should not allow vote with 0 tokens", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");

      await expect(threadVoting.connect(addr1).vote(1, 0)).to.be.revertedWith(
        "Must vote with at least 1 token"
      );
    });

    it("Should not allow voting before voting period start", async function () {
      const { governanceToken, addr1 } = await loadFixture(deployContract);

      const now = await time.latest();
      const threadUpcomming = await ethers.deployContract("ThreadVoting");
      await threadUpcomming.initialize(
        governanceToken.target,
        DESCRIPTION,
        now + 3600 * 24,
        now + 3600 * 48
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadUpcomming.target, 100);
      await threadUpcomming.createProposal("Proposal 1");

      await expect(threadUpcomming.vote(1, 50)).to.be.revertedWith(
        "Voting period not started"
      );
    });

    it("Should not allow voting after voting period ends", async function () {
      const { governanceToken, addr1 } = await loadFixture(deployContract);

      const now = await time.latest();
      const threadEnded = await ethers.deployContract("ThreadVoting");
      await threadEnded.initialize(
        governanceToken.target,
        DESCRIPTION,
        now - 3600 * 48,
        now - 3600 * 24
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadEnded.target, 100);
      await threadEnded.connect(addr1).createProposal("Proposal 1");

      await expect(threadEnded.connect(addr1).vote(1, 50)).to.be.revertedWith(
        "Voting period has ended"
      );
    });
  });

  describe("Finishing Voting Period", function () {
    it("Should determine the winning proposal", async function () {
      const { threadVoting, governanceToken, owner, addr1, addr2 } =
        await loadFixture(deployContract);

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.mint(addr2.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);
      await governanceToken.connect(addr2).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr2).createProposal("Proposal 2");

      await threadVoting.connect(addr1).vote(1, 50);
      await threadVoting.connect(addr2).vote(2, 100);

      await threadVoting.finishVotingPeriod();

      expect(await threadVoting.winningProposal()).to.equal(2);
    });

    it("Should not allow finishing voting period multiple times", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);
      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 100);
      await threadVoting.finishVotingPeriod();

      await expect(threadVoting.finishVotingPeriod()).to.be.revertedWith(
        "Thread was ended"
      );
    });

    it("Should return 0 if there are no proposals", async function () {
      const { threadVoting } = await loadFixture(deployContract);

      await threadVoting.finishVotingPeriod();

      expect(await threadVoting.winningProposal()).to.equal(0);
    });
  });

  describe("Withdrawing Tokens", function () {
    it("Should allow users to withdraw tokens after voting period ends", async function () {
      const { threadVoting, governanceToken, owner, addr1, now } =
        await loadFixture(deployContract);

      await governanceToken.mint(owner.address, 100);
      await governanceToken.mint(addr1.address, 100);
      await governanceToken.approve(threadVoting.target, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.createProposal("Proposal 1");
      await threadVoting.vote(1, 100);
      await threadVoting.connect(addr1).vote(1, 100);

      await threadVoting.finishVotingPeriod();
      await threadVoting.withdrawTokens();
      await threadVoting.connect(addr1).withdrawTokens();

      expect(await governanceToken.balanceOf(owner.address)).to.equal(110);
      expect(await governanceToken.balanceOf(addr1.address)).to.equal(90);
    });

    it("Should not allow users to withdraw tokens before voting period ends", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 100);

      await expect(threadVoting.withdrawTokens()).to.be.revertedWith(
        "Voting period not ended"
      );
    });

    it("Should error thread not ended or no winning proposal", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.createProposal("Proposal 1");
      await threadVoting.finishVotingPeriod();

      await expect(threadVoting.withdrawTokens()).to.be.revertedWith(
        "Thread not ended or no winning proposal"
      );
    });

    it("Should not allow users to withdraw tokens if they have not voted", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 100);
      await threadVoting.finishVotingPeriod();

      await expect(threadVoting.withdrawTokens()).to.be.revertedWith(
        "User not voted to winning proposal"
      );
    });

    it("Should not allow users to withdraw tokens multiple times", async function () {
      const { threadVoting, governanceToken, addr1 } = await loadFixture(
        deployContract
      );

      await governanceToken.mint(addr1.address, 100);
      await governanceToken.connect(addr1).approve(threadVoting.target, 100);

      await threadVoting.connect(addr1).createProposal("Proposal 1");
      await threadVoting.connect(addr1).vote(1, 100);
      await threadVoting.finishVotingPeriod();
      await threadVoting.connect(addr1).withdrawTokens();

      await expect(
        threadVoting.connect(addr1).withdrawTokens()
      ).to.be.revertedWith("Tokens have already been withdrawn");
    });
  });
});
