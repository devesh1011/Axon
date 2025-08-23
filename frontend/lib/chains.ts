import { defineChain } from "viem";

export const zetachainAthensTestnet = defineChain({
  id: Number.parseInt(process.env.NEXT_PUBLIC_ZETA_CHAIN_ID || "7001"),
  name: "ZetaChain Athens Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ZETA",
    symbol: "ZETA",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ZETA_RPC_URL ||
          "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "ZetaScan",
      url:
        process.env.NEXT_PUBLIC_ZETA_EXPLORER ||
        "https://athens.explorer.zetachain.com",
    },
  },
  testnet: true,
});

export const zetaChainAthens = zetachainAthensTestnet;

// Chain configuration for wagmi
export const chains = [zetaChainAthens] as const;

// Contract addresses
export const contracts = {
  omniSoul: {
    address: process.env.NEXT_PUBLIC_OMNISOUL_ADDRESS as `0x${string}`,
    chainId: parseInt(process.env.NEXT_PUBLIC_OMNISOUL_CHAIN_ID || "7001"),
  },
} as const;
