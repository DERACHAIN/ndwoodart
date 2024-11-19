import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20", function () {
  const TokenName = "My Token";
  const TokenSymbol = "myto";
  const TokenDecimals = 18;

  async function deployContract() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const erc20Factory = await ethers.getContractFactory("ERC20");
    const deploy = await erc20Factory.deploy(
      TokenName,
      TokenSymbol,
      TokenDecimals
    );
    const myToken = await deploy.waitForDeployment();

    await myToken.mint(owner.address, 1000000);

    console.log(
      "contract created: ",
      await myToken.name(),
      await myToken.symbol(),
      await myToken.decimals(),
      await myToken.totalSupply(),
      myToken.target
    );

    // Fixtures can return anything you consider useful for your tests
    return { myToken, owner, addr1, addr2 };
  }

  async function deployNDWoodArtPoint() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const erc20Factory = await ethers.getContractFactory("NDWoodArtPoint");
    const deploy = await erc20Factory.deploy();
    const myToken = await deploy.waitForDeployment();

    await myToken.mint(owner.address, 1000000);

    console.log(
      "contract point created: ",
      await myToken.name(),
      await myToken.symbol(),
      await myToken.decimals(),
      await myToken.totalSupply(),
      myToken.target
    );

    // Fixtures can return anything you consider useful for your tests
    return { myToken, owner, addr1, addr2 };
  }

  describe("Initialization", function () {
    it("Should set right information", async function () {
      const { myToken, owner } = await loadFixture(deployContract);

      expect(await myToken.name()).to.equal(TokenName);
      expect(await myToken.symbol()).to.equal(TokenSymbol);
      expect(await myToken.decimals()).to.equal(TokenDecimals);

      expect(await myToken.balanceOf(owner.address)).to.equal(
        await myToken.totalSupply()
      );
    });
  });

  describe("Transfer", function () {
    it("Error if balances of sender not enough", async function () {
      const { myToken, addr1, addr2 } = await loadFixture(deployContract);
      let transfer = myToken.connect(addr1).transfer(addr2, 100);
      await expect(transfer).to.be.revertedWith("Not enough tokens");

      await myToken.transfer(addr1, 50);
      expect(await myToken.balanceOf(addr1)).to.equal(50);

      transfer = myToken.connect(addr1).transfer(addr2, 100);
      await expect(transfer).to.be.revertedWith("Not enough tokens");
    });

    it("Should set right balances after transfer", async function () {
      const { myToken, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );

      const transfer = await myToken.transfer(addr1, 100);
      const transfer2 = await myToken.connect(addr1).transfer(addr2, 50);

      expect(await myToken.balanceOf(owner)).to.equal(
        (await myToken.totalSupply()) - BigInt(100)
      );
      expect(await myToken.balanceOf(addr1)).to.equal(50);
      expect(await myToken.balanceOf(addr2)).to.equal(50);

      await expect(transfer)
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, 100);
      await expect(transfer2)
        .to.emit(myToken, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });
  });

  describe("Approve", function () {
    it("Error if balances not enough", async function () {
      const { myToken, addr1, addr2 } = await loadFixture(deployContract);
      let approve = myToken.connect(addr1).approve(addr2, 100);
      await expect(approve).to.be.revertedWith("Not enough tokens");

      await myToken.transfer(addr1, 50);
      expect(await myToken.balanceOf(addr1)).to.equal(50);

      approve = myToken.connect(addr1).approve(addr2, 100);
      await expect(approve).to.be.revertedWith("Not enough tokens");
    });

    it("Should set right balances after approve", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployContract);

      const approve = await myToken.approve(addr1, 50);

      expect(await myToken.balanceOf(addr1)).to.equal(0);
      expect(await myToken.allowance(owner, addr1)).to.equal(50);

      await expect(approve)
        .to.emit(myToken, "Approval")
        .withArgs(owner.address, addr1.address, 50);
    });
  });

  describe("TransferFrom", function () {
    it("Error if balances not enough", async function () {
      const { myToken, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );

      let transfer = myToken.transferFrom(addr1, addr2, 100);
      await expect(transfer).to.be.revertedWith("Not enough tokens");

      await myToken.approve(addr1, 50);
      expect(await myToken.allowance(owner, addr1)).to.equal(50);

      transfer = myToken.transferFrom(owner, addr1, 100);
      await expect(transfer).to.be.revertedWith("Not enough allowance");
    });

    it("Should set right balances after transfer", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployContract);

      await myToken.approve(addr1, 100);
      const transfer = await myToken
        .connect(addr1)
        .transferFrom(owner, addr1, 100);

      expect(await myToken.balanceOf(addr1)).to.equal(100);
      expect(await myToken.allowance(owner, addr1)).to.equal(0);

      await expect(transfer)
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, 100);
    });
  });

  describe("Mint", function () {
    it("Should set right balances after mint", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployContract);

      await myToken.mint(addr1, 100);

      expect(await myToken.balanceOf(addr1)).to.equal(100);
      expect(await myToken.totalSupply()).to.equal(
        (await myToken.balanceOf(owner)) + BigInt(100)
      );
    });

    it("Should revert when non-owner tries to mint", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployNDWoodArtPoint);

      await expect(myToken.connect(addr1).mint(addr1.address, 100))
        .to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);

      // Verify that the balance and total supply remain unchanged
      expect(await myToken.balanceOf(addr1.address)).to.equal(0);
      expect(await myToken.totalSupply()).to.equal(
        await myToken.balanceOf(owner)
      );
    });
  });

  describe("Burn", function () {
    it("Error if balances not enough", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployContract);

      let transfer = myToken.burn(addr1, 100);
      await expect(transfer).to.be.revertedWith("Not enough tokens");

      await myToken.approve(addr1, 50);
      expect(await myToken.allowance(owner, addr1)).to.equal(50);

      transfer = myToken.burn(addr1, 100);
      await expect(transfer).to.be.revertedWith("Not enough tokens");
    });

    it("Should set right balances after burn", async function () {
      const { myToken, owner } = await loadFixture(deployContract);

      const valueAfterBurn = (await myToken.balanceOf(owner)) - BigInt(100);
      await myToken.burn(owner, 100);

      expect(await myToken.balanceOf(owner)).to.equal(valueAfterBurn);
      expect(await myToken.totalSupply()).to.equal(valueAfterBurn);
    });

    it("Should revert when non-owner tries to burn", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployNDWoodArtPoint);

      // Mint some tokens to addr1 first
      await myToken.mint(addr1.address, 100);

      // Attempt to burn tokens from addr1 using addr1's connection (non-owner)
      await expect(myToken.connect(addr1).burn(addr1.address, 50))
        .to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);

      // Verify that the balance and total supply remain unchanged
      expect(await myToken.balanceOf(addr1.address)).to.equal(100);
      expect(await myToken.totalSupply()).to.equal(
        (await myToken.balanceOf(owner)) + BigInt(100)
      );
    });
  });

  describe("NDWoodArtPoint", function () {
    it("Deploy contract NDWoodArtPoint", async function () {
      const myTokenFactory = await ethers.getContractFactory("NDWoodArtPoint");
      const deploy = await myTokenFactory.deploy();
      const myToken = await deploy.waitForDeployment();

      expect(await myToken.name()).to.equal("NDWoodArt Point");
      expect(await myToken.symbol()).to.equal("NDL");
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should set right balances after mint", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployContract);

      await myToken.mint(addr1, 100);

      expect(await myToken.balanceOf(addr1)).to.equal(100);
      expect(await myToken.totalSupply()).to.equal(
        (await myToken.balanceOf(owner)) + BigInt(100)
      );
    });

    it("Should set right balances after burn", async function () {
      const { myToken, owner } = await loadFixture(deployNDWoodArtPoint);

      const valueAfterBurn = (await myToken.balanceOf(owner)) - BigInt(100);
      await myToken.burn(owner, 100);

      expect(await myToken.balanceOf(owner)).to.equal(valueAfterBurn);
      expect(await myToken.totalSupply()).to.equal(valueAfterBurn);
    });
  });
});
