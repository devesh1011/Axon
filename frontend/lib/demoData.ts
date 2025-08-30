// Demo data for showcasing cross-chain asset linking functionality

interface EVMNFTData {
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collection: string;
  blockchain: string;
}

interface SolanaNFTData {
  mint: string;
  name: string;
  image: string;
  collection: string;
  blockchain: string;
}

export type DemoNFTData = EVMNFTData | SolanaNFTData;

export const demoNFTs = {
  ethereum: [
    {
      contractAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      tokenId: "1234",
      name: "Bored Ape #1234",
      image:
        "https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=384",
      collection: "Bored Ape Yacht Club",
      blockchain: "ethereum",
    },
    {
      contractAddress: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
      tokenId: "5678",
      name: "Mutant Ape #5678",
      image:
        "https://i.seadn.io/gae/lHexKRMpw-aoSyewIAMTJGrBnCPd9iHHv4G-jAEUuOcSAGPe5qqgFXkT4SnGVRUIJL4Kw-T2mxr7DkAFYR_jgGxDBj0B",
      collection: "Mutant Ape Yacht Club",
      blockchain: "ethereum",
    },
  ],
  polygon: [
    {
      contractAddress: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
      tokenId: "9876",
      name: "OpenSea Creature #9876",
      image: "https://openseacreatures.io/image/9876",
      collection: "OpenSea Creatures",
      blockchain: "polygon",
    },
  ],
  bsc: [
    {
      contractAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      tokenId: "4321",
      name: "Pancake Squad #4321",
      image: "https://pancakeswap.finance/images/nfts/pancake-squad/4321.png",
      collection: "Pancake Squad",
      blockchain: "bsc",
    },
  ],
  arbitrum: [
    {
      contractAddress: "0x1234567890123456789012345678901234567890",
      tokenId: "1111",
      name: "Arbitrum Odyssey #1111",
      image:
        "https://via.placeholder.com/300x300/4338CA/FFFFFF?text=Arbitrum+NFT",
      collection: "Arbitrum Odyssey",
      blockchain: "arbitrum",
    },
  ],
  optimism: [
    {
      contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      tokenId: "2222",
      name: "Optimism Collective #2222",
      image:
        "https://via.placeholder.com/300x300/FF0420/FFFFFF?text=Optimism+NFT",
      collection: "Optimism Collective",
      blockchain: "optimism",
    },
  ],
  solana: [
    {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      name: "Solana Monkey #7777",
      image: "https://arweave.net/example-solana-monkey-image",
      collection: "Solana Monkey Business",
      blockchain: "solana",
    },
    {
      mint: "So11111111111111111111111111111111111111112",
      name: "DeGods #3333",
      image: "https://metadata.degods.com/g/3333.png",
      collection: "DeGods",
      blockchain: "solana",
    },
  ],
};

export const demoWalletAddresses = {
  ethereum: "0x742d35Cc6634C0532925a3b8D591D1B347169bC6",
  polygon: "0x742d35Cc6634C0532925a3b8D591D1B347169bC6",
  bsc: "0x742d35Cc6634C0532925a3b8D591D1B347169bC6",
  arbitrum: "0x742d35Cc6634C0532925a3b8D591D1B347169bC6",
  optimism: "0x742d35Cc6634C0532925a3b8D591D1B347169bC6",
  solana: "DemoWallet1234567890123456789012345678901234567890",
};

export const linkedAssetsDemo = [
  {
    id: "1",
    personalityTokenId: "1",
    crossChainContract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    crossChainTokenId: "1234",
    crossChainName: "ethereum",
    linkedAt: new Date("2024-12-15").toISOString(),
    metadata: demoNFTs.ethereum[0],
  },
  {
    id: "2",
    personalityTokenId: "1",
    crossChainContract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
    crossChainTokenId: "9876",
    crossChainName: "polygon",
    linkedAt: new Date("2024-12-20").toISOString(),
    metadata: demoNFTs.polygon[0],
  },
];

// Demo mode flag - set to true for demonstrations
export const DEMO_MODE =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";
