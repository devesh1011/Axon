// /api/ai/embeddings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { docEmbeddings } from "@/lib/server/persona-embeddings";
import crypto from "crypto";

interface SelectedFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

async function calculateFingerprint(file: File): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const tokenId = formData.get("tokenId") as string;

    if (!tokenId || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Token ID and files are required." },
        { status: 400 }
      );
    }

    const { data: existingRecords } = await supabase
      .from("persona_embeddings")
      .select("fingerprint")
      .eq("token_id", tokenId);
    const existingFingerprints = new Set(
      existingRecords?.map((r) => r.fingerprint) || []
    );

    const newFilesToProcess: SelectedFile[] = [];
    const newFileMetadata = [];

    for (const file of files) {
      const fingerprint = await calculateFingerprint(file);
      if (existingFingerprints.has(fingerprint)) {
        console.log(`[Embeddings API] Skipping duplicate file: ${file.name}`);
        continue;
      }
      newFilesToProcess.push({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      });
      newFileMetadata.push({
        fingerprint,
        model: "text-embedding-004",
        embedding_dim: 768,
        metadata: { source: file.name, size: file.size, type: file.type },
      });
    }

    if (newFilesToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        insertedCount: 0,
        message: "No new files to process.",
      });
    }

    const personaKey = `persona:${tokenId}`;
    const result = await docEmbeddings(newFilesToProcess, tokenId, personaKey);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    const recordsToInsert = newFileMetadata.map((meta) => ({
      token_id: tokenId,
      persona_key: personaKey,
      fingerprint: meta.fingerprint,
      model: meta.model,
      embedding_dim: meta.embedding_dim,
      metadata: meta.metadata,
    }));
    await supabase.from("persona_embeddings").insert(recordsToInsert);

    return NextResponse.json({
      ...result,
      newFilesProcessed: newFilesToProcess.length,
    });
  } catch (e) {
    console.error("Embeddings API failed:", e);
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
