export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "coffee-urgent-crab-303.mypinata.cloud",
});

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  try {
    const { cid } = params;

    if (!cid || typeof cid !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid CID" },
        { status: 400 }
      );
    }

    try {
      // Use Pinata SDK to fetch the data and gateway URL
      const data = await pinata.gateways.public.get(cid);
      const gatewayUrl = await pinata.gateways.public.convert(cid);

      // Try to detect content type
      const contentType = "application/octet-stream";
      // Note: Pinata SDK response may not have a type property
      // You can add custom logic here to detect content type if needed

      // Return the raw data and gateway URL
      return NextResponse.json({
        success: true,
        data,
        gatewayUrl,
        contentType,
      });
    } catch (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch from Pinata gateway",
          details: String(fetchError),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("IPFS get error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content from IPFS" },
      { status: 500 }
    );
  }
}
