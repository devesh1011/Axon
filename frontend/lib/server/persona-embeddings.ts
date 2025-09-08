// frontend/lib/server/persona-embeddings.ts
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { supabase } from "@/lib/supabase";

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
        documents.push({
          pageContent: chunk,
          metadata: {
            source: t.name,
            token_id: tokenId,
            persona_key: personaKey,
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

  console.log(`[docEmbeddings] Inserting ${documents.length} documents`);

  try {
    // Use addDocuments method which handles embeddings properly
    const result = await store.addDocuments(documents);

    // Now update the records to include token_id and persona_key in separate columns
    // Get the IDs of the records we just inserted
    const { data: insertedRecords, error: fetchError } = await supabase
      .from("persona_vectors")
      .select("id")
      .is("token_id", null)
      .order("created_at", { ascending: false })
      .limit(documents.length);

    if (fetchError) {
      console.warn(
        "[docEmbeddings] Could not fetch inserted record IDs:",
        fetchError
      );
    } else if (insertedRecords && insertedRecords.length > 0) {
      // Update the records with token_id and persona_key
      const { error: updateError } = await supabase
        .from("persona_vectors")
        .update({
          token_id: tokenId,
          persona_key: personaKey,
        })
        .in(
          "id",
          insertedRecords.map((r) => r.id)
        );

      if (updateError) {
        console.warn(
          "[docEmbeddings] Could not update token_id and persona_key:",
          updateError
        );
      } else {
        console.log(
          `[docEmbeddings] Updated ${insertedRecords.length} records with token_id and persona_key`
        );
      }
    }

    console.log(
      `[Embeddings] Successfully inserted ${documents.length} document chunks into persona_vectors.`
    );
    return { success: true, insertedCount: documents.length };
  } catch (e) {
    console.error("Error adding documents to vector store:", e);
    return { success: false, error: `Database insertion failed: ${String(e)}` };
  }
}
