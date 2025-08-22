export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import { supabase } from "@/lib/supabase";
import { getContract } from "viem";
import { publicClient } from "@/lib/server/viem-server";
import { zetachainAthensTestnet, contracts } from "@/lib/chains";
import OmniSoulABI from "@/lib/abis/OmniSoul.json";

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "example-gateway.mypinata.cloud",
});

interface CreateNFTRequest {
  walletAddress: string;
  name: string;
  description: string;
  imageFile?: File;
  imageCid?: string;
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
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    console.log(`NFT creation request from IP: ${clientIP}`);

    const body: CreateNFTRequest = await request.json();
    const {
      walletAddress,
      name,
      description,
      imageCid,
      personalData,
      uploadedFiles,
    } = body;

    // Validate required fields
    if (!walletAddress || !name || !description) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Wallet address, name, and description are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
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

    console.log("Creating and uploading metadata to IPFS...");

    // Get or create wallet profile
    let profile;

    const { data: existingProfile, error: profileError } = await supabase
      .from("wallet_profiles")
      .select("id")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        {
          error: {
            code: "PROFILE_ERROR",
            message: "Failed to fetch user profile",
          },
        },
        { status: 500 }
      );
    }

    if (existingProfile) {
      profile = existingProfile;
    } else {
      // If profile doesn't exist, create one
      const { data: newProfile, error: createProfileError } = await supabase
        .from("wallet_profiles")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          display_name: `User ${walletAddress.slice(
            0,
            6
          )}...${walletAddress.slice(-4)}`,
        })
        .select("id")
        .single();

      if (createProfileError) {
        console.error("Error creating profile:", createProfileError);
        return NextResponse.json(
          {
            error: {
              code: "PROFILE_ERROR",
              message: "Failed to create user profile",
            },
          },
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    // Create enriched metadata
    const metadata = {
      name,
      description,
      image: imageCid ? `ipfs://${imageCid}` : undefined,
      attributes: [
        {
          trait_type: "Type",
          value: "Omni-Soul",
        },
        {
          trait_type: "Files Uploaded",
          value: uploadedFiles?.length || 0,
        },
        ...(personalData?.interests?.length
          ? [
              {
                trait_type: "Interests",
                value: personalData.interests.join(", "),
              },
            ]
          : []),
        ...(personalData?.personality_traits?.length
          ? [
              {
                trait_type: "Personality",
                value: personalData.personality_traits.join(", "),
              },
            ]
          : []),
      ],
      personalData: personalData || {},
      uploadedFiles: uploadedFiles || [],
      external_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/persona/`,
      created_at: new Date().toISOString(),
      version: "1.0.0",
      type: "OmniSoul",
    };

    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });

    const metadataFile = new File([metadataBlob], "metadata.json", {
      type: "application/json",
    });

    const { cid: metadataCid } = await pinata.upload.public.file(metadataFile);
    const tokenURI = `ipfs://${metadataCid}`;

    console.log(`Metadata uploaded to IPFS: ${tokenURI}`);

    // Get contract instance for minting
    const contract = getContract({
      address: contracts.omniSoul.address,
      abi: OmniSoulABI,
      client: publicClient,
    });

    try {
      // Simulate minting process (in production, this would be a real transaction)
      const simulatedTokenId = Math.floor(Math.random() * 10000);
      const simulatedTxHash = `0x${Math.random()
        .toString(16)
        .substring(2, 66)}`;

      // Save NFT data to Supabase
      const { data: nftData, error: supabaseError } = await supabase
        .from("nfts")
        .insert({
          profile_id: profile.id,
          token_id: simulatedTokenId.toString(),
          name,
          description,
          metadata_uri: tokenURI,
          pinata_cid: metadataCid,
          image_cid: imageCid || null,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: simulatedTxHash,
          uploaded_files: uploadedFiles?.map((f) => f.cid) || [],
        })
        .select()
        .single();

      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        return NextResponse.json(
          {
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to save NFT to database",
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        tokenId: simulatedTokenId,
        transactionHash: simulatedTxHash,
        owner: walletAddress,
        tokenURI,
        metadataCid,
        imageCid,
        step: "nft_minted",
        explorerUrl: `${zetachainAthensTestnet.blockExplorers.default.url}/tx/${simulatedTxHash}`,
        nftData,
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
  } catch (error: unknown) {
    console.error("NFT creation error:", error);

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
            "An unexpected error occurred while creating NFT. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
