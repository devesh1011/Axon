require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const { PRIVATE_KEY, RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    zetachain_testnet: {
      url:
        RPC_URL || "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 7001,
    },
    zetachain_mainnet: {
      url: "https://rpc.ankr.com/zetachain_evm",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 7000,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
