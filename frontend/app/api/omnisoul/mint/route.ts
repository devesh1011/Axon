export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  basicRateLimiter,
} from "../../../../lib/server/rate-limit";
import { getContract } from "viem";
import { publicClient } from "../../../../lib/server/viem-server";
import { ZETACHAIN_CONFIG } from "../../../../lib/chains";
import OmniSoulABI from "../../../../lib/abis/OmniSoul.json";

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // Rate limiting
    await checkRateLimit(basicRateLimiter, clientIP);

    const body = await request.json();
    const { owner, tokenURI } = body;

    if (!owner || !tokenURI) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Owner address and tokenURI are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid Ethereum address format",
          },
        },
        { status: 400 }
      );
    }

    // Get contract instance
    const contract = getContract({
      address: ZETACHAIN_CONFIG.contracts.omniSoul,
      abi: OmniSoulABI,
      client: publicClient,
    });

    try {
      // This would normally call the actual mint function
      // For now, we'll simulate the minting process

      // In a real implementation, you would:
      // 1. Use a wallet client with private key to sign the transaction
      // 2. Call contract.write.mintOmniSoul([owner, tokenURI])
      // 3. Wait for transaction confirmation
      // 4. Parse the transaction receipt for the token ID

      // Simulated response for development
      const simulatedTokenId = Math.floor(Math.random() * 10000);
      const simulatedTxHash = `0x${Math.random()
        .toString(16)
        .substring(2, 66)}`;

      return NextResponse.json({
        success: true,
        tokenId: simulatedTokenId,
        transactionHash: simulatedTxHash,
        owner,
        tokenURI,
        step: "nft_minted",
        explorerUrl: `${ZETACHAIN_CONFIG.blockExplorer}/tx/${simulatedTxHash}`,
      });
    } catch (contractError) {
      console.error("Contract interaction error:", contractError);
      return NextResponse.json(
        {
          error: {
            code: "MINT_FAILED",
            message: "Failed to mint NFT on blockchain",
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Mint NFT error:", error);

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: error.message } },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: { code: "MINT_FAILED", message: "Failed to mint NFT" } },
      { status: 500 }
    );
  }
}
