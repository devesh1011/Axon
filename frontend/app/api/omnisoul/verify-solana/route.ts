export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { VerifySolanaSchema } from "@/lib/zodSchemas";
import { Connection, PublicKey } from "@solana/web3.js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = VerifySolanaSchema.safeParse(body);
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

    const { rpcUrl, mint, wallet } = validation.data;

    // Get RPC URL
    const finalRpcUrl =
      rpcUrl ||
      process.env.SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    try {
      // Create connection
      const connection = new Connection(finalRpcUrl, "confirmed");

      // Validate addresses
      const mintPubkey = new PublicKey(mint);
      const walletPubkey = new PublicKey(wallet);

      // Get token accounts for the wallet
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletPubkey,
        {
          mint: mintPubkey,
        }
      );

      // Check if wallet owns any tokens of this mint
      let isOwner = false;
      let tokenAmount = 0;

      for (const tokenAccount of tokenAccounts.value) {
        const accountInfo = await connection.getTokenAccountBalance(
          tokenAccount.pubkey
        );
        const amount = Number.parseInt(accountInfo.value.amount);

        if (amount > 0) {
          isOwner = true;
          tokenAmount += amount;
        }
      }

      // For NFTs, we expect exactly 1 token
      const isNFT = tokenAmount === 1;

      return NextResponse.json({
        success: true,
        data: {
          isOwner: isOwner && isNFT,
          owner: wallet,
          mint,
          tokenAmount,
          isNFT,
        },
      });
    } catch (solanaError: any) {
      console.error("Solana verification error:", solanaError);

      // Handle specific errors
      if (solanaError.message?.includes("Invalid public key")) {
        return NextResponse.json(
          { success: false, error: "Invalid Solana address or mint" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to verify Solana NFT ownership" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Solana verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify Solana NFT" },
      { status: 500 }
    );
  }
}
