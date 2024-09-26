import { ethers } from "hardhat";

async function main() {
  const collectionAddress = "0x84D599e057BD268a6f5F48F8b75914fa006008E8";
  const collection = await ethers.getContractAt("MyNFT", collectionAddress);

  // const privateKey =
  //   "464dba1ef94a0c4db16d38955b854accfd33529d489e0450bacbb5bf1a785ee8";
  // const wallet = new ethers.Wallet(privateKey, ethers.provider);

  // const tx = await collection.connect(wallet).mint(wallet.address, 0);
  // await tx.wait();

  console.log(`success: ${await collection.ownerOf(0)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
