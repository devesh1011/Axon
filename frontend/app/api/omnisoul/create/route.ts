export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { CreateOmniSoulSchema } from "@/lib/zodSchemas";
import ky from "ky";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateOmniSoulSchema.safeParse(body);
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

    const { owner, metadata } = validation.data;

    // Pin metadata to IPFS
    const pinResponse = await ky
      .post(`${request.nextUrl.origin}/api/ipfs/pin-json`, {
        json: {
          data: metadata,
          pinName: `Axon-metadata-${metadata.name
            .replace(/\s+/g, "-")
            .toLowerCase()}`,
        },
      })
      .json<{ success: boolean; data?: { cid: string }; error?: string }>();

    if (!pinResponse.success || !pinResponse.data) {
      throw new Error(pinResponse.error || "Failed to pin metadata to IPFS");
    }

    return NextResponse.json({
      success: true,
      data: {
        cid: pinResponse.data.cid,
        tokenURI: `ipfs://${pinResponse.data.cid}`,
        metadata,
      },
    });
  } catch (error) {
    console.error("OmniSoul create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create OmniSoul metadata" },
      { status: 500 }
    );
  }
}
