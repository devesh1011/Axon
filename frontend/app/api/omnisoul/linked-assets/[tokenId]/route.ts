export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: "Token ID is required" },
        { status: 400 }
      );
    }

    // Fetch linked assets for the token
    const { data: linkedAssets, error } = await supabase
      .from("linked_assets")
      .select("*")
      .eq("omni_soul_token_id", parseInt(tokenId))
      .order("linked_at", { ascending: false });

    if (error) {
      console.error("Error fetching linked assets:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch linked assets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: linkedAssets || [],
    });
  } catch (error) {
    console.error("Linked assets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch linked assets" },
      { status: 500 }
    );
  }
}
