export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "example-gateway.mypinata.cloud",
});

interface MetadataRequestBody {
  metadata: {
    name: string;
    description: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    // Additional persona data
    personalData?: {
      bio?: string;
      background?: string;
      interests?: string[];
      goals?: string[];
      personality_traits?: string[];
    };
    uploadedFiles?: Array<{
      cid: string;
      name: string;
      type: string;
    }>;
  };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    console.log(`Metadata creation request from IP: ${clientIP}`);

    const body: MetadataRequestBody = await request.json();
    const { metadata } = body;

    // Validate required fields
    if (!metadata) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Metadata is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate metadata
    if (!metadata.name || !metadata.description) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Metadata must include name and description",
          },
        },
        { status: 400 }
      );
    }

    console.log("Creating and uploading metadata to IPFS...");

    // Create enriched metadata
    const enrichedMetadata = {
      ...metadata,
      external_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/persona/`,
      created_at: new Date().toISOString(),
      version: "1.0.0",
      type: "OmniSoul",
    };

    const metadataBlob = new Blob([JSON.stringify(enrichedMetadata, null, 2)], {
      type: "application/json",
    });

    const metadataFile = new File([metadataBlob], "metadata.json", {
      type: "application/json",
    });

    const { cid: metadataCid } = await pinata.upload.public.file(metadataFile);
    const tokenURI = `ipfs://${metadataCid}`;

    console.log(`Metadata uploaded to IPFS: ${tokenURI}`);

    return NextResponse.json({
      success: true,
      tokenURI,
      metadataCid,
      metadata: enrichedMetadata,
      message: "Metadata created successfully. Use this tokenURI to mint your NFT.",
    });

  } catch (error: unknown) {
    console.error("Metadata creation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if it's a Pinata error
    if (errorMessage.includes("Pinata") || errorMessage.includes("IPFS")) {
      return NextResponse.json(
        {
          error: {
            code: "IPFS_ERROR",
            message: "Failed to upload metadata to IPFS. Please try again.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while creating metadata. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
