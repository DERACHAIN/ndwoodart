# ndwoodart

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

- Deploy contract:
```shell
KIND=erc1155 NAME="My 1155 Collection" SYMBOL=my15 npx hardhat run ./scripts/deploy-contract.ts --network bnb_testnet
```

- Verify contract:
```shell
npx hardhat verify <contract address> "My 1155 Collection" my15 --network bnb_testnet
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