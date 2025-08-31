// /api/nft/save/route.ts
export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface SaveNFTRequest {
  tokenId: string;
  transactionHash: string;
  tokenURI: string;
  walletAddress: string;
}

// Helper function to get or create a wallet profile and return its ID
async function getOrCreateProfileId(walletAddress: string): Promise<string> {
  const lowercasedAddress = walletAddress.toLowerCase();

  // First, try to fetch the existing profile
  const { data: existingProfile, error: selectError } = await supabase
    .from("wallet_profiles")
    .select("id")
    .eq("wallet_address", lowercasedAddress)
    .single();

  // If a profile is found, return its ID
  if (existingProfile) {
    return existingProfile.id;
  }

  // If the error is anything other than "no rows found", something went wrong
  if (selectError && selectError.code !== "PGRST116") {
    console.error("Error fetching wallet profile:", selectError);
    throw new Error("Failed to fetch user profile.");
  }

  // If no profile was found, create a new one
  const { data: newProfile, error: insertError } = await supabase
    .from("wallet_profiles")
    .insert({
      wallet_address: lowercasedAddress,
      display_name: `User ${lowercasedAddress.slice(
        0,
        6
      )}...${lowercasedAddress.slice(-4)}`,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating wallet profile:", insertError);
    throw new Error("Failed to create user profile.");
  }

  return newProfile.id;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveNFTRequest = await request.json();
    const { tokenId, transactionHash, tokenURI, walletAddress } = body;

    if (!tokenId || !transactionHash || !tokenURI || !walletAddress) {
      return NextResponse.json(
        {
          error:
            "Token ID, transaction hash, token URI, and wallet address are required.",
        },
        { status: 400 }
      );
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format." },
        { status: 400 }
      );
    }

    // 1. Get the profile ID for the user
    const profileId = await getOrCreateProfileId(walletAddress);

    // 2. Fetch metadata from IPFS to enrich the NFT record
    let metadata: any = {};
    try {
      if (tokenURI.startsWith("ipfs://")) {
        const cid = tokenURI.replace("ipfs://", "");
        // Ensure you have PINATA_GATEWAY in your .env file
        const metadataUrl = `${
          process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
        }/ipfs/${cid}`;
        const response = await fetch(metadataUrl);
        if (response.ok) {
          metadata = await response.json();
        } else {
          console.warn(`Failed to fetch metadata from IPFS for CID: ${cid}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch or parse metadata:", error);
      // Don't block saving the NFT if metadata fetch fails
    }

    // 3. Save the NFT data using `upsert` for robustness
    // This will create a new record or update an existing one based on the `token_id`.
    const { data: nftData, error: supabaseError } = await supabase
      .from("nfts")
      .upsert(
        {
          profile_id: profileId,
          token_id: tokenId,
          name: metadata?.name || `Axon #${tokenId}`,
          description: metadata?.description || "An Axon NFT.",
          metadata_uri: tokenURI,
          pinata_cid: tokenURI.replace("ipfs://", ""),
          image_cid: metadata?.image?.replace("ipfs://", "") || null,
          wallet_address: walletAddress.toLowerCase(),
          transaction_hash: transactionHash,
          // NOTE: The `uploaded_files` column has been removed from this insert.
          // The `persona_embeddings` table is the single source of truth for this relationship.
        },
        {
          onConflict: "token_id", // Specify the column to check for conflicts
        }
      )
      .select()
      .single();

    if (supabaseError) {
      console.error("Supabase error while saving NFT:", supabaseError);
      return NextResponse.json(
        { error: "Failed to save NFT to database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nftData,
      message: "NFT saved successfully.",
    });
  } catch (error) {
    console.error("An unexpected error occurred in /api/nft/save:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
