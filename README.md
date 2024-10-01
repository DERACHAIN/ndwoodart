# NDWoodArt

Smart contracts for NDWoodArt, including but not limited to DAO voting, Gacha, Smart Account, Membership, Points.

## Prerequisites
- [NodeJS v20.x](https://nodejs.org/en)
- [Hardhat v2.22.x](https://hardhat.org/)
- [OpenZeppelin v5.x](https://docs.openzeppelin.com/contracts/5.x/)

## Setup
- Install npm dependencies
```bash
$ npm install
```

- Create .env file from template
```bash
$ cp .env.example .env
```

- Fulfill credentials and secrets to .env file

## Compile
- Compile smart contracts
```bash
$ npx hardhat compile
```

## Test
- Execute Unit tests
```bash
$ npx hardhat test
```

- Generate coverage report
```bash
$ npx hardhat coverage
```

## Deploy
- (Hardhat local) Spin up local Hardhat node
```bash
$ npx hardhat node
```

- (Real networks) Add supported chain config to hardhat.config.ts
```typescript
const config: HardhatUserConfig = {
  networks: {
    bnb_testnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: [privateKeyFromEnv]
    },
  }
}
```

### Deploy contract:
- Contract NDWoodArt Point (NDL)
```shell
KIND=erc20 NAME="NDWoodArt Point" SYMBOL=NDL DECIMALS=18 npx hardhat run ./scripts/deploy-contract.ts --network derachain
```

*Verify contract:*
```shell
npx hardhat verify <contract address> "NDWoodArt Point" NDL 18 --network derachain
```

- Contract NDWoodArt 1155 (for gacha, traits)
```shell
KIND=erc1155 NAME="NDWoodArt Items" SYMBOL=NDI npx hardhat run ./scripts/deploy-contract.ts --network derachain
```

*Verify contract:*
```shell
npx hardhat verify <contract address> "NDWoodArt Items" NDI --network derachain
```

- NDWoodArt Membership Card (NDMC): Membership NFT contract is a Collection of NFT2 Prococol. To deploy NFT2 Collection follow [this guide](https://github.com/darenft-labs/nft2-smart-contracts-v1) 

### Deploy Implementation:
- Deploy Thread Voting (DAO Voting Implementation)
```shell
KIND=threadVoting npx hardhat run ./scripts/deploy-implementation.ts --network derachain
```

### Deploy Factory
- Deploy Thread Factory
```shell
KIND=thread npx hardhat run ./scripts/deploy-factory.ts --network derachain
```

## Cleanup
- Cleanup smart contracts artifacts
```bash
$ npx hardhat clean
```

## Troubleshoot
- Deployment is sometimes failed due to networks congestion, the solution is needing to wait for traffic restabilize and redeploy.

## License
Copyright belongs to [DareNFT - Alpha Waves PTE. LTD](https://darenft.com/), 2023