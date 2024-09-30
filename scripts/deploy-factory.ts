import { ethers } from "hardhat";

async function main() {
  switch (process.env.KIND) {
    case "thread": {
      const factory = await ethers.deployContract("ThreadFactory");
      console.log(`Deploy Thread Factory at ${factory.target}`);
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
