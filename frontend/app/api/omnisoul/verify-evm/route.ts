export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { VerifyEvmSchema } from "@/lib/zodSchemas";
import { SimpleRateLimiter } from "@/lib/rateLimiter";
import { ethers } from "ethers";

const rateLimiter = new SimpleRateLimiter({
  points: Number.parseInt(process.env.RATE_LIMIT_POINTS || "30"),
  duration: Number.parseInt(process.env.RATE_LIMIT_DURATION || "60"),
});

// Chain RPC mappings
const CHAIN_RPCS: Record<string, string> = {
  ethereum: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
  polygon: process.env.POLYGON_RPC_URL || "https://polygon.llamarpc.com",
  bsc: "https://bsc-dataseed.binance.org",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
};

// ERC-721 ABI for ownerOf function
const ERC721_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      const clientIP =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "anonymous";
      await rateLimiter.consume(clientIP);
    } catch {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = VerifyEvmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { chain, rpcUrl, nftContract, tokenId, wallet } = validation.data;

    // Get RPC URL
    const finalRpcUrl = rpcUrl || CHAIN_RPCS[chain];
    if (!finalRpcUrl) {
      return NextResponse.json(
        { success: false, error: `No RPC URL configured for chain: ${chain}` },
        { status: 400 }
      );
    }

    try {
      // Create provider and contract instance
      const provider = new ethers.JsonRpcProvider(finalRpcUrl);
      const contract = new ethers.Contract(nftContract, ERC721_ABI, provider);

      // Call ownerOf function
      const owner = await contract.ownerOf(BigInt(tokenId));

      // Check if the wallet matches the owner
      const isOwner = owner.toLowerCase() === wallet.toLowerCase();

      return NextResponse.json({
        success: true,
        data: {
          isOwner,
          owner,
          chain,
          nftContract,
          tokenId: tokenId.toString(),
        },
      });
    } catch (contractError: any) {
      console.error("Contract call error:", contractError);

      // Handle specific errors
      if (
        contractError.message?.includes("nonexistent token") ||
        contractError.message?.includes("invalid token")
      ) {
        return NextResponse.json(
          { success: false, error: "Token does not exist" },
          { status: 404 }
        );
      }

      if (contractError.message?.includes("not a contract")) {
        return NextResponse.json(
          { success: false, error: "Invalid contract address" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to verify NFT ownership" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("EVM verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify EVM NFT" },
      { status: 500 }
    );
  }
}
