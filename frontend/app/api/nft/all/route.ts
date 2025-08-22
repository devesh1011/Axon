export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ky from "ky";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Fetch all NFTs from Supabase with pagination
    const {
      data: nfts,
      error,
      count,
    } = await supabase
      .from("nfts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch NFTs from database" },
        { status: 500 }
      );
    }

    // Fetch metadata for each NFT from IPFS
    const nftsWithMetadata = await Promise.all(
      (nfts || []).map(async (nft) => {
        try {
          let imageUrl = "";
          let metadata = null;

          // Get image URL from image_cid
          if (nft.image_cid) {
            imageUrl = `${process.env.PINATA_GATEWAY}/ipfs/${nft.image_cid}`;
          }

          // Get metadata from IPFS
          if (nft.metadata_uri) {
            let metadataUrl = nft.metadata_uri;
            if (metadataUrl.startsWith("ipfs://")) {
              const cid = metadataUrl.replace("ipfs://", "");
              metadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${cid}`;
            }

            try {
              metadata = await ky.get(metadataUrl, { timeout: 10000 }).json();
            } catch (metadataError) {
              console.error(
                `Failed to fetch metadata for NFT ${nft.token_id}:`,
                metadataError
              );
              // Continue without metadata if it fails to load
            }
          }

          return {
            id: nft.id,
            tokenId: nft.token_id,
            name: nft.name,
            description: nft.description,
            imageUrl,
            metadataUri: nft.metadata_uri,
            pinataCid: nft.pinata_cid,
            imageCid: nft.image_cid,
            walletAddress: nft.wallet_address,
            transactionHash: nft.transaction_hash,
            createdAt: nft.created_at,
            updatedAt: nft.updated_at,
            metadata,
            uploadedFiles: nft.uploaded_files || [],
            // Add owner display name
            ownerDisplayName: `User ${nft.wallet_address.slice(
              0,
              6
            )}...${nft.wallet_address.slice(-4)}`,
          };
        } catch (error) {
          console.error(`Error processing NFT ${nft.token_id}:`, error);
          // Return basic NFT data without metadata if processing fails
          return {
            id: nft.id,
            tokenId: nft.token_id,
            name: nft.name,
            description: nft.description,
            imageUrl: nft.image_cid
              ? `${process.env.PINATA_GATEWAY}/ipfs/${nft.image_cid}`
              : "",
            metadataUri: nft.metadata_uri,
            pinataCid: nft.pinata_cid,
            imageCid: nft.image_cid,
            walletAddress: nft.wallet_address,
            transactionHash: nft.transaction_hash,
            createdAt: nft.created_at,
            updatedAt: nft.updated_at,
            metadata: null,
            uploadedFiles: nft.uploaded_files || [],
            ownerDisplayName: `User ${nft.wallet_address.slice(
              0,
              6
            )}...${nft.wallet_address.slice(-4)}`,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: nftsWithMetadata,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page < Math.ceil((count || 0) / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("All NFTs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
