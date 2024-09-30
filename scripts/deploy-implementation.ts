import { ethers } from "hardhat";

async function main() {
  switch (process.env.KIND) {
    case "threadVoting": {
      const implementation = await ethers.deployContract("ThreadVoting");
      console.log(
        `Deploy ThreadVoting implementation at ${implementation.target}`
      );
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
