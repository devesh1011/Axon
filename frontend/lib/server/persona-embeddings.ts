// frontend/lib/server/persona-embeddings.ts
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

interface SelectedFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

type DocEmbeddingsResult = {
  success: boolean;
  insertedCount?: number;
  fingerprint?: string;
  error?: string;
};

export async function docEmbeddings(
  files: SelectedFile[],
  tokenId: string,
  personaKey: string
): Promise<DocEmbeddingsResult> {
  if (!Array.isArray(files) || files.length === 0) {
    return { success: false, error: "no files provided" };
  }

  let embedder;
  try {
    if (!process.env.GOOGLE_API_KEY)
      throw new Error("GOOGLE_API_KEY is not set.");
    embedder = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
    });
  } catch (e) {
    console.error("[docEmbeddings] failed to init embedder:", e);
    return { success: false, error: `Embedder init failed: ${String(e)}` };
  }

  const texts: { name: string; text: string }[] = [];

  for (const f of files) {
    let content = "";
    try {
      if (f.name.toLowerCase().endsWith(".pdf")) {
        const loader = new PDFLoader(f.file as Blob);
        const loadedDocs = await loader.load();
        content = loadedDocs.map((d: any) => d.pageContent).join("\n\n");
      } else {
        content = await f.file.text();
      }

      const nonAsciiChars = content.match(/[^\x00-\x7F]/g) || [];
      if (content.length > 100 && nonAsciiChars.length / content.length > 0.5) {
        console.warn(
          `[Embeddings] Skipping file ${f.name} due to probable binary content.`
        );
        content = "";
      }
      texts.push({ name: f.name, text: content.trim() });
    } catch (e) {
      console.warn(`[Embeddings] Error reading file ${f.name}:`, e);
      texts.push({ name: f.name, text: "" });
    }
  }

  const documents: any[] = [];
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    for (const t of texts) {
      if (!t.text || t.text.length < 20) {
        console.warn(
          `[Embeddings] Skipping empty or too-small content from ${t.name}`
        );
        continue;
      }

      const chunks = await textSplitter.splitText(t.text);
      for (const chunk of chunks) {
        const chunkHash = crypto
          .createHash("sha256")
          .update(chunk)
          .digest("hex");
        documents.push({
          pageContent: chunk,
          metadata: {
            source: t.name,
            token_id: tokenId,
            persona_key: personaKey,
            chunk_hash: chunkHash,
          },
        });
      }
    }

    if (documents.length === 0) {
      return {
        success: false,
        error: "No valid text content found in files after processing.",
      };
    }
  } catch (e) {
    return { success: false, error: `Chunking failed: ${String(e)}` };
  }

  let store: any;
  try {
    store = new SupabaseVectorStore(embedder, {
      client: supabase,
      tableName: "persona_vectors",
      queryName: "match_documents",
    });
  } catch (e) {
    console.error("[docEmbeddings] failed to init SupabaseVectorStore:", e);
    return { success: false, error: `vectorstore init failed: ${String(e)}` };
  }

  const BATCH_SIZE = 50;
  let inserted = 0;
  try {
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);

      // Sanitize each document's pageContent within the batch
      const sanitizedBatch = batch.map((doc) => ({
        ...doc,
        pageContent: doc.pageContent.replace(/\u0000/g, ""),
      }));

      await store.addDocuments(sanitizedBatch);
      inserted += sanitizedBatch.length;
    }

    console.log(
      `[Embeddings] Inserted ${inserted} document chunks into persona_vectors.`
    );
    return { success: true, insertedCount: inserted };
  } catch (e) {
    console.error("Error adding documents to vector store:", e);
    return { success: false, error: `Database insertion failed: ${String(e)}` };
  }
}
