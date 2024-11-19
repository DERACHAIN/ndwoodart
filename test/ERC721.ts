import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";

describe("ERC721", function () {
  const CollectionName = "My NFT Collection";
  const CollectionSymbol = "mync";
  const DefaultTokenURI =
    "https://darenft.myfilebase.com/ipfs/QmQAmuUqtcK4uaovbCoJwZeoGJv9PdLHnvQjYmUGduEHoN";
  const _INTERFACE_ID_ERC165 = "0x01ffc9a7";
  const _INTERFACE_ID_ERC721 = "0x80ac58cd";
  const _INTERFACE_ID_ERC721_METADATA = "0x5b5e139f";
  const _ERC721_RECEIVED = "0x150b7a02";

  async function deployContract() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const myNFTFactory = await ethers.getContractFactory("MyNFT");
    const deploy = await myNFTFactory.deploy(CollectionName, CollectionSymbol);
    const myCollection = await deploy.waitForDeployment();

    console.log(
      "contract created: ",
      await myCollection.name(),
      await myCollection.symbol(),
      myCollection.target
    );

    // Fixtures can return anything you consider useful for your tests
    return { myCollection, owner, addr1, addr2 };
  }

  describe("Initialization", function () {
    it("Should set right information", async function () {
      const { myCollection, owner } = await loadFixture(deployContract);

      expect(await myCollection.name()).to.equal(CollectionName);
      expect(await myCollection.symbol()).to.equal(CollectionSymbol);
      expect(await myCollection.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("SupportsInterface", function () {
    it("Should return right", async function () {
      const { myCollection } = await loadFixture(deployContract);

      let isSupport = await myCollection.supportsInterface(
        _INTERFACE_ID_ERC165
      );
      expect(isSupport).to.equal(true);

      isSupport = await myCollection.supportsInterface(_INTERFACE_ID_ERC721);
      expect(isSupport).to.equal(true);

      isSupport = await myCollection.supportsInterface(
        _INTERFACE_ID_ERC721_METADATA
      );
      expect(isSupport).to.equal(true);

      isSupport = await myCollection.supportsInterface(_ERC721_RECEIVED);
      expect(isSupport).to.equal(false);
    });
  });

  describe("TokenURI", function () {
    it("Error if token not exist", async function () {
      const { myCollection } = await loadFixture(deployContract);
      let tokenURI = myCollection.tokenURI(0);
      await expect(tokenURI).to.be.revertedWith("token doesn't exist");
    });

    it("Should set right token uri", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);

      await myCollection.mint(addr1, 0);
      expect(await myCollection.tokenURI(0)).to.equal(DefaultTokenURI);
    });
  });

  describe("OwnerOf", function () {
    it("Error if token not exist", async function () {
      const { myCollection } = await loadFixture(deployContract);
      let ownerOf = myCollection.ownerOf(0);
      await expect(ownerOf).to.be.revertedWith("token doesn't exist");
    });

    it("Should set right owner", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);
      expect(await myCollection.ownerOf(0)).to.equal(addr1.address);
    });
  });

  describe("BalanceOf", function () {
    it("Error if owner is zero", async function () {
      const { myCollection } = await loadFixture(deployContract);
      let balanceOf = myCollection.balanceOf(ZeroAddress);
      await expect(balanceOf).to.be.revertedWith("owner = zero address");
    });

    it("Should set right balances", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);
      expect(await myCollection.balanceOf(addr1)).to.equal(1);
    });
  });

  describe("Approve", function () {
    it("Error if not authorized", async function () {
      const { myCollection, owner, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);

      let approve = myCollection.approve(owner, 0);
      await expect(approve).to.be.revertedWith("not authorized");
    });

    it("Should set right approve all", async function () {
      const { myCollection, owner, addr1 } = await loadFixture(deployContract);

      let approveAll = await myCollection.setApprovalForAll(addr1, true);
      expect(await myCollection.isApprovedForAll(owner, addr1)).to.equal(true);
      await expect(approveAll)
        .to.emit(myCollection, "ApprovalForAll")
        .withArgs(owner.address, addr1.address, true);
    });

    it("Should set right approve", async function () {
      const { myCollection, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );
      await myCollection.mint(owner, 0);

      let approve = await myCollection.approve(addr1, 0);
      expect(await myCollection.getApproved(0)).to.equal(addr1);
      await expect(approve)
        .to.emit(myCollection, "Approval")
        .withArgs(owner.address, addr1.address, 0);

      await myCollection.setApprovalForAll(addr1, true);
      expect(await myCollection.isApprovedForAll(owner, addr1)).to.equal(true);

      approve = await myCollection.connect(addr1).approve(addr2, 0);
      expect(await myCollection.getApproved(0)).to.equal(addr2);
      await expect(approve)
        .to.emit(myCollection, "Approval")
        .withArgs(owner.address, addr2.address, 0);
    });
  });

  describe("TransferFrom", function () {
    it("Error if not owner", async function () {
      const { myCollection, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );
      await myCollection.mint(addr1, 0);

      let transfer = myCollection.transferFrom(owner, addr2, 0);
      await expect(transfer).to.be.revertedWith("from != owner");
    });

    it("Error if transfer to zero address", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);

      let transfer = myCollection.transferFrom(addr1, ZeroAddress, 0);
      await expect(transfer).to.be.revertedWith("transfer to zero address");
    });

    it("Error if not authorized", async function () {
      const { myCollection, addr1, addr2 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);

      let transfer = myCollection.transferFrom(addr1, addr2, 0);
      await expect(transfer).to.be.revertedWith("not authorized");
    });

    it("Should transfer right", async function () {
      const { myCollection, owner, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(owner, 0);

      let transfer = await myCollection.transferFrom(owner, addr1, 0);
      expect(await myCollection.ownerOf(0)).to.equal(addr1);
      expect(await myCollection.balanceOf(owner)).to.equal(0);
      expect(await myCollection.balanceOf(addr1)).to.equal(1);
      await expect(transfer)
        .to.emit(myCollection, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
    });

    it("Should transfer right with approve", async function () {
      const { myCollection, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );
      await myCollection.mint(owner, 0);

      await myCollection.setApprovalForAll(addr1, true);
      await myCollection.connect(addr1).transferFrom(owner, addr2, 0);
      expect(await myCollection.ownerOf(0)).to.equal(addr2);

      await myCollection.connect(addr2).approve(addr1, 0);
      await myCollection.connect(addr1).transferFrom(addr2, owner, 0);
      expect(await myCollection.ownerOf(0)).to.equal(owner);
    });
  });

  describe("SafeTransferFrom", function () {
    it("Error if not ERC721Receiver", async function () {
      const { myCollection, owner, addr1, addr2 } = await loadFixture(
        deployContract
      );
      await myCollection.mint(owner, 0);

      const erc20Factory = await ethers.getContractFactory("ERC20");
      const deploy = await erc20Factory.deploy("Test", "test", 18);
      const myToken = await deploy.waitForDeployment();
      const myTokenContract = await myToken.getAddress();

      let transfer = myCollection["safeTransferFrom(address,address,uint256)"](
        owner,
        myTokenContract,
        0
      );
      await expect(transfer).to.be.revertedWithoutReason();
    });

    it("Success if is not contract", async function () {
      const { myCollection, owner, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(owner, 0);

      await myCollection["safeTransferFrom(address,address,uint256)"](
        owner,
        addr1,
        0
      );
      expect(await myCollection.ownerOf(0)).to.equal(addr1);
    });

    it("Success if is ERC721Receiver", async function () {
      const { myCollection, owner } = await loadFixture(deployContract);
      await myCollection.mint(owner, 0);

      const mockERC721Receiver = await ethers.deployContract(
        "MockERC721Receiver"
      );
      const myContract = await mockERC721Receiver.getAddress();

      await myCollection["safeTransferFrom(address,address,uint256,bytes)"](
        owner,
        myContract,
        0,
        "0x"
      );
      expect(await myCollection.ownerOf(0)).to.equal(myContract);
    });
  });

  describe("Mint", function () {
    it("Error if mint to zero", async function () {
      const { myCollection } = await loadFixture(deployContract);
      let mint = myCollection.mint(ZeroAddress, 0);
      await expect(mint).to.be.revertedWith("mint to zero address");
    });

    it("Error if already minted", async function () {
      const { myCollection, owner } = await loadFixture(deployContract);
      await myCollection.mint(owner, 10);
      let mint = myCollection.mint(owner, 10);
      await expect(mint).to.be.revertedWith("already minted");
    });

    it("Should set right mint info", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      let mint = await myCollection.mint(addr1, 0);

      expect(await myCollection.balanceOf(addr1)).to.equal(1);
      expect(await myCollection.ownerOf(0)).to.equal(addr1.address);
      expect(await myCollection.tokenURI(0)).to.equal(DefaultTokenURI);
      expect(await myCollection.startingIndex()).to.equal(1);

      await expect(mint)
        .to.emit(myCollection, "Transfer")
        .withArgs(ZeroAddress, addr1, 0);
    });
  });

  describe("Burn", function () {
    it("Error if not owner", async function () {
      const { myCollection } = await loadFixture(deployContract);
      let burn = myCollection.burn(0);
      await expect(burn).to.be.revertedWith("not minted");
    });

    it("Error if not authorized", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);
      let burn = myCollection.burn(0);
      await expect(burn).to.be.revertedWith("not authorized");
    });

    it("Should set right burn info", async function () {
      const { myCollection, addr1 } = await loadFixture(deployContract);
      await myCollection.mint(addr1, 0);
      let burn = await myCollection.connect(addr1).burn(0);

      let ownerOf = myCollection.ownerOf(0);
      await expect(ownerOf).to.be.revertedWith("token doesn't exist");
      expect(await myCollection.balanceOf(addr1)).to.equal(0);
      let tokenURI = myCollection.tokenURI(0);
      await expect(tokenURI).to.be.revertedWith("token doesn't exist");

      await expect(burn)
        .to.emit(myCollection, "Transfer")
        .withArgs(addr1, ZeroAddress, 0);
    });
  });
});
