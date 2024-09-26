import { ethers } from "hardhat";

async function main() {
  switch (process.env.KIND) {
    case "erc20": {
      const name = process.env.NAME;
      const symbol = process.env.SYMBOL;
      const decimals = process.env.DECIMALS
        ? parseInt(process.env.DECIMALS)
        : 18;

      if (!name || !symbol) throw new Error(`Name and symbol must not empty`);

      const erc20Factory = await ethers.getContractFactory("ERC20");
      const deploy = await erc20Factory.deploy(name, symbol, decimals);
      const erc20 = await deploy.waitForDeployment();

      console.log(`Deploy ERC20 at address ${erc20.target}`);
      break;
    }
    case "erc721": {
      const name = process.env.NAME;
      const symbol = process.env.SYMBOL;

      if (!name || !symbol) throw new Error(`Name and symbol must not empty`);

      const factory = await ethers.getContractFactory("MyNFT");
      const deploy = await factory.deploy(name, symbol);
      const myCollection = await deploy.waitForDeployment();

      console.log(`Deploy ERC721 at address ${myCollection.target}`);
      break;
    }
    case "erc1155": {
      const name = process.env.NAME;
      const symbol = process.env.SYMBOL;

      if (!name || !symbol) throw new Error(`Name and symbol must not empty`);

      const factory = await ethers.getContractFactory("MyMultiToken");
      const deploy = await factory.deploy(name, symbol);
      const myCollection = await deploy.waitForDeployment();

      console.log(`Deploy ERC1155 at address ${myCollection.target}`);
      break;
    }
    default: {
      throw new Error(`Kind ${process.env.KIND} is not supported`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
