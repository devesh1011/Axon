export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  basicRateLimiter,
} from "../../../../lib/server/rate-limit";
import { pinJSON } from "../../../../lib/server/pinata";

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
    const { metadata } = body;

    if (!metadata) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "Metadata is required" },
        },
        { status: 400 }
      );
    }

    // Pin metadata to IPFS
    const result = await pinJSON(metadata, `omnisoul-${metadata.name}`);

    return NextResponse.json({
      success: true,
      cid: result.cid,
      tokenURI: `ipfs://${result.cid}`,
      gatewayUrl: `${process.env.PINATA_GATEWAY}/ipfs/${result.cid}`,
      step: "metadata_pinned",
      nextStep: "mint_nft",
    });
  } catch (error) {
    console.error("Pin metadata error:", error);

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: error.message } },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "PIN_FAILED",
          message: "Failed to pin metadata to IPFS",
        },
      },
      { status: 500 }
    );
  }
}
