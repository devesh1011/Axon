export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface SaveNFTRequest {
  tokenId: string;
  transactionHash: string;
  tokenURI: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveNFTRequest = await request.json();
    const { tokenId, transactionHash, tokenURI, walletAddress } = body;

    // Validate required fields
    if (!tokenId || !transactionHash || !tokenURI || !walletAddress) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Token ID, transaction hash, token URI, and wallet address are required",
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

    // Extract metadata from tokenURI to get basic info
    let metadata = null;
    try {
      if (tokenURI.startsWith("ipfs://")) {
        const cid = tokenURI.replace("ipfs://", "");
        const metadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
        const response = await fetch(metadataUrl);
        metadata = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
    }

    // Save NFT data to Supabase
    const { data: nftData, error: supabaseError } = await supabase
      .from("nfts")
      .insert({
        profile_id: profile.id,
        token_id: tokenId,
        name: metadata?.name || `Omni-Soul #${tokenId}`,
        description: metadata?.description || "Omni-Soul NFT",
        metadata_uri: tokenURI,
        pinata_cid: tokenURI.replace("ipfs://", ""),
        image_cid: metadata?.image?.replace("ipfs://", "") || null,
        wallet_address: walletAddress.toLowerCase(),
        transaction_hash: transactionHash,
        uploaded_files:
          metadata?.uploadedFiles?.map(
            (f: Record<string, unknown>) => (f as { cid: string }).cid
          ) || [],
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
      data: nftData,
      message: "NFT saved to database successfully",
    });
  } catch (error) {
    console.error("Save NFT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save NFT to database" },
      { status: 500 }
    );
  }
}
