import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    avax: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY!],
    },
    avax_fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!],
    },
    bnb: {
      url: "https://bsc-dataseed.bnbchain.org/",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY!],
    },
    bnb_testnet: {
      url: "https://data-seed-prebsc-1-s2.bnbchain.org:8545/",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY!],
    },
    polygon_amoy: {
      url: `https://rpc-amoy.polygon.technology`,
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY!],
    },
    derachain: {
      chainId: 20240801,
      url: "https://rpc-testnet.derachain.com/ext/bc/2WMFYSdPEx6LR3gsQfQtiezMwSUijqxuPa61wVE66rnc2aHKL6/rpc",
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      avalanche: "snowtrace", // apiKey is not required, just set a placeholder
      avax_fuji: "snowtrace", // apiKey is not required, just set a placeholder
      bscTestnet: process.env.BSCSCAN_API_KEY!, // obtain one at https://bscscan.com/
      bsc: process.env.BSCSCAN_API_KEY!, // obtain one at https://bscscan.com/
      polygonAmoy: process.env.POLYGONSCAN_API_KEY!, // obtain one at https://polygonscan.com/
      derachain: "empty",
    },
    customChains: [
      {
        network: "avax_fuji",
        chainId: 43113,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
      {
        network: "polygon_amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "derachain",
        chainId: 20240801,
        urls: {
          apiURL: "https://trace.derachain.com/api",
          browserURL: "https://trace.derachain.com",
        },
      },
    ],
  },
};

export default config;
