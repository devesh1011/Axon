export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";

import { PinataSDK } from "pinata";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/json",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "example-gateway.mypinata.cloud",
});
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file uploads
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: "No file provided",
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: "File size exceeds 10MB limit",
          },
          { status: 413 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `File type ${file.type} not allowed`,
          },
          { status: 400 }
        );
      }

      // Pin file to IPFS
      const { cid } = await pinata.upload.public.file(file);
      const url = await pinata.gateways.public.convert(cid);

      return NextResponse.json({
        success: true,
        data: {
          cid: cid,
          gatewayUrl: url,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid content type. Expected multipart/form-data",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("IPFS upload error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to upload to IPFS",
      },
      { status: 500 }
    );
  }
}
