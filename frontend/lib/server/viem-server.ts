import { createPublicClient, http, getContract } from "viem";
import { zetachainAthensTestnet } from "viem/chains";

// Contract ABI - simplified for the key functions we need
const OmniSoulABI = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getTokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Initialize public client for reading blockchain data
const publicClient = createPublicClient({
  chain: zetachainAthensTestnet,
  transport: http(
    process.env.NEXT_PUBLIC_ZETA_RPC_URL ||
      "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
  ),
});

// Contract address
const OMNISOUL_ADDRESS = process.env
  .NEXT_PUBLIC_OMNISOUL_ADDRESS as `0x${string}`;

if (!OMNISOUL_ADDRESS) {
  throw new Error(
    "NEXT_PUBLIC_OMNISOUL_ADDRESS environment variable is required"
  );
}

// Contract instance
const omniSoulContract = getContract({
  address: OMNISOUL_ADDRESS,
  abi: OmniSoulABI,
  client: publicClient,
});

// Helper functions
export async function getOwnerOf(tokenId: string): Promise<string> {
  try {
    const owner = await omniSoulContract.read.ownerOf([BigInt(tokenId)]);
    return owner;
  } catch (error) {
    console.error(`Error getting owner of token ${tokenId}:`, error);
    throw new Error("Failed to get token owner");
  }
}

export async function getTokenURI(tokenId: string): Promise<string> {
  try {
    // Try the standard tokenURI function first
    try {
      const uri = await omniSoulContract.read.tokenURI([BigInt(tokenId)]);
      return uri;
    } catch (error) {
      // If that fails, try the custom getTokenURI function
      const uri = await omniSoulContract.read.getTokenURI([BigInt(tokenId)]);
      return uri;
    }
  } catch (error) {
    console.error(`Error getting token URI for token ${tokenId}:`, error);
    throw new Error("Failed to get token URI");
  }
}

export async function getTotalSupply(): Promise<number> {
  try {
    const totalSupply = await omniSoulContract.read.totalSupply();
    return Number(totalSupply);
  } catch (error) {
    console.error("Error getting total supply:", error);
    throw new Error("Failed to get total supply");
  }
}

// Fetch and parse token metadata
export async function fetchTokenMetadata(tokenId: string): Promise<any> {
  try {
    const tokenURI = await getTokenURI(tokenId);

    if (!tokenURI) {
      throw new Error("Token URI is empty");
    }

    // Handle IPFS URIs
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith("ipfs://")) {
      const cid = tokenURI.replace("ipfs://", "");
      metadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
    }

    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error(`Error fetching token metadata for token ${tokenId}:`, error);
    throw new Error("Failed to fetch token metadata");
  }
}

export { publicClient, omniSoulContract };
