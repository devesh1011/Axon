export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { getOmniSoulContract } from "@/lib/ethersClient";
import ky from "ky";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { success: false, error: "Invalid token ID" },
        { status: 400 }
      );
    }

    const contract = getOmniSoulContract();

    try {
      // Get token URI from contract
      const tokenURI = await contract.tokenURI(BigInt(tokenId));

      if (!tokenURI) {
        return NextResponse.json(
          { success: false, error: "Token not found" },
          { status: 404 }
        );
      }

      // Get token owner
      const owner = await contract.ownerOf(BigInt(tokenId));

      // Resolve IPFS URI to HTTP
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith("ipfs://")) {
        const cid = tokenURI.replace("ipfs://", "");
        metadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
      }

      // Fetch metadata from IPFS
      const metadataResponse = await ky
        .get(metadataUrl, { timeout: 10000 })
        .json();

      return NextResponse.json({
        success: true,
        data: {
          tokenId: Number(tokenId),
          tokenURI,
          owner,
          metadata: metadataResponse,
        },
      });
    } catch (contractError) {
      console.error("Contract error:", contractError);
      return NextResponse.json(
        { success: false, error: "Token not found or contract error" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
