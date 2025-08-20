export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ky from "ky";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    // Fetch NFTs from Supabase
    const { data: nfts, error } = await supabase
      .from("nfts")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .order("created_at", { ascending: false });

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
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: nftsWithMetadata,
      count: nftsWithMetadata.length,
    });
  } catch (error) {
    console.error("User NFTs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user NFTs" },
      { status: 500 }
    );
  }
}
