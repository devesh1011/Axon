export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface LinkAssetRequest {
  tokenId: string;
  chainName: string;
  assetAddress: string;
  assetId: string;
  walletAddress: string;
  transactionHash: string;
  metadata?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LinkAssetRequest = await request.json();

    // Validate required fields
    if (
      !body.tokenId ||
      !body.chainName ||
      !body.assetAddress ||
      !body.walletAddress ||
      !body.transactionHash
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create wallet profile
    let profile;
    const { data: existingProfile, error: profileError } = await supabase
      .from("wallet_profiles")
      .select("*")
      .eq("wallet_address", body.walletAddress.toLowerCase())
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: "Failed to fetch wallet profile" },
        { status: 500 }
      );
    }

    if (existingProfile) {
      profile = existingProfile;
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from("wallet_profiles")
        .insert({
          wallet_address: body.walletAddress.toLowerCase(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: "Failed to create wallet profile" },
          { status: 500 }
        );
      }

      profile = newProfile;
    }

    // Save linked asset to database
    const { data: linkedAsset, error: linkError } = await supabase
      .from("linked_assets")
      .insert({
        profile_id: profile.id,
        omni_soul_token_id: parseInt(body.tokenId),
        chain_name: body.chainName,
        asset_address: body.assetAddress,
        asset_id: body.assetId || "0",
        metadata: body.metadata || "",
        wallet_address: body.walletAddress.toLowerCase(),
        transaction_hash: body.transactionHash,
        linked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (linkError) {
      console.error("Link asset error:", linkError);
      return NextResponse.json(
        { success: false, error: "Failed to save linked asset" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: linkedAsset,
    });
  } catch (error) {
    console.error("Link asset error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link asset" },
      { status: 500 }
    );
  }
}
