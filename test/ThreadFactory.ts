import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("ThreadFactory", function () {
  async function deployFactoryAndImplementation() {
    const [owner, addr1] = await ethers.getSigners();
    const threadVotingImplementation = await ethers.deployContract(
      "ThreadVoting"
    );
    const threadFactory = await ethers.deployContract("ThreadFactory");

    return { threadFactory, threadVotingImplementation, owner, addr1 };
  }

  describe("Deployment", function () {
    it("Should deploy the factory and implementation contracts", async function () {
      const { threadFactory, threadVotingImplementation } = await loadFixture(
        deployFactoryAndImplementation
      );

      expect(threadFactory.target).to.properAddress;
      expect(threadVotingImplementation.target).to.properAddress;
    });
  });

  describe("Create Thread", function () {
    it("Should create a new thread voting contract", async function () {
      const { threadFactory, threadVotingImplementation, owner } =
        await loadFixture(deployFactoryAndImplementation);

      const governanceToken = await ethers.deployContract("ERC20", [
        "Test",
        "TST",
        18,
      ]);
      const now = await time.latest();

      const tx = await threadFactory.createThread(
        threadVotingImplementation.target,
        governanceToken.target,
        "Test Thread",
        now,
        now + 3600 * 24
      );

      const receipt = await tx.wait();

      const event: any = receipt?.logs?.find((event: any) => {
        if (event.hasOwnProperty("fragment")) {
          return event.fragment.name === "ThreadVotingCreated";
        }
        return false;
      });
      const [threadVotingAddress] = event?.args || [];

      expect(threadVotingAddress).to.properAddress;

      const threadVoting = await ethers.getContractAt(
        "ThreadVoting",
        threadVotingAddress
      );
      expect(await threadVoting.governanceToken()).to.equal(
        governanceToken.target
      );
      expect(await threadVoting.description()).to.equal("Test Thread");
      expect(await threadVoting.startTime()).to.equal(now);
      expect(await threadVoting.endTime()).to.equal(now + 3600 * 24);
    });

    it("Should not allow creating the same thread twice", async function () {
      const { threadFactory, threadVotingImplementation, owner } =
        await loadFixture(deployFactoryAndImplementation);

      const governanceToken = await ethers.deployContract("ERC20", [
        "Test",
        "TST",
        18,
      ]);
      const now = await time.latest();

      await threadFactory.createThread(
        threadVotingImplementation.target,
        governanceToken.target,
        "Test Thread",
        now,
        now + 3600 * 24
      );

      await expect(
        threadFactory.createThread(
          threadVotingImplementation.target,
          governanceToken.target,
          "Test Thread",
          now,
          now + 3600 * 24
        )
      ).to.be.revertedWith("Thread is deployed already.");
    });
  });
});
