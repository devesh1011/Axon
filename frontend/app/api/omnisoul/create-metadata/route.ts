export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting

    const body = await request.json();

    // Validate required fields for metadata creation
    const { name, description, personalData, uploadedFiles } = body;

    if (!name || !description) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and description are required",
          },
        },
        { status: 400 }
      );
    }

    // Create NFT metadata structure
    const metadata = {
      name,
      description,
      image: uploadedFiles?.profileImage || "",
      attributes: [
        { trait_type: "Created", value: new Date().toISOString() },
        { trait_type: "Version", value: "1.0" },
        { trait_type: "Type", value: "OmniSoul" },
      ],
      properties: {
        personalData: personalData || {},
        uploadedFiles: uploadedFiles || [],
        created: new Date().toISOString(),
        version: "1.0",
        type: "OmniSoul",
      },
    };

    // Add additional attributes based on personal data
    if (personalData?.occupation) {
      metadata.attributes.push({
        trait_type: "Occupation",
        value: personalData.occupation,
      });
    }
    if (personalData?.location) {
      metadata.attributes.push({
        trait_type: "Location",
        value: personalData.location,
      });
    }
    if (personalData?.interests?.length > 0) {
      metadata.attributes.push({
        trait_type: "Interests",
        value: personalData.interests.join(", "),
      });
    }

    return NextResponse.json({
      success: true,
      metadata,
      step: "metadata_created",
      nextStep: "pin_metadata",
    });
  } catch (error) {
    console.error("Create metadata error:", error);

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: error.message } },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "METADATA_CREATION_FAILED",
          message: "Failed to create metadata",
        },
      },
      { status: 500 }
    );
  }
}
