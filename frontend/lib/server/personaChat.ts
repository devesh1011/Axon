import { supabase } from "@/lib/supabase";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import type { Document } from "@langchain/core/documents";

// Helper to format retrieved documents from RAG
const formatDocs = (docs: Document[]): string => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Helper to format the persona metadata object into a readable string
const formatPersonaData = (data: any): string => {
  if (!data) {
    return "No additional persona data provided.";
  }
  return `
- Bio: ${data.bio || "Not specified."}
- Background: ${data.background || "Not specified."}
- Interests: ${data.interests?.join(", ") || "Not specified."}
- Goals: ${data.goals?.join(", ") || "Not specified."}
- Personality Traits: ${data.personality_traits?.join(", ") || "Not specified."}
  `.trim();
};

// This function gets the persona data, using the cache first and
// only falling back to a slow IPFS fetch if necessary.
async function getPersonaDataWithCache(personaKey: string): Promise<string> {
  // 1. Check the Supabase cache first.
  const { data: cachedData } = await supabase
    .from("persona_metadata_cache")
    .select("metadata_json")
    .eq("persona_key", personaKey)
    .single();

  if (cachedData) {
    return formatPersonaData(cachedData.metadata_json);
  }

  // 2. Cache MISS. Fetch from the original source (nfts table -> IPFS).
  const tokenId = personaKey.split(":")[1];
  if (!tokenId) throw new Error("Invalid personaKey format.");

  const { data: nftData, error: nftError } = await supabase
    .from("nfts")
    .select("metadata_uri")
    .eq("token_id", tokenId)
    .single();

  if (nftError || !nftData?.metadata_uri) {
    throw new Error(`Could not find NFT metadata for token ID ${tokenId}.`);
  }

  const cid = nftData.metadata_uri.replace("ipfs://", "");
  const gatewayUrl = `${
    process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
  }/ipfs/${cid}`;
  const response = await fetch(gatewayUrl);
  if (!response.ok) throw new Error(`Failed to fetch metadata from IPFS.`);

  const metadata = await response.json();
  const personalData = metadata.personalData; // Extract the specific data object

  // 3. IMPORTANT: Write the newly fetched data back to the cache.
  const { error: cacheInsertError } = await supabase
    .from("persona_metadata_cache")
    .insert({
      persona_key: personaKey,
      metadata_json: personalData, // Store the extracted object
    });

  if (cacheInsertError) {
    // This is not a critical error; the user still gets a response.
    console.error("Failed to write to metadata cache:", cacheInsertError);
  }

  return formatPersonaData(personalData);
}

// --- Main Chat Function ---
export async function personaChat(msg: string, personaKey: string) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not found.");
  }

  // Step 1: Get Persona Metadata (now using the fast, cached method)
  const formattedPersonaData = await getPersonaDataWithCache(personaKey);

  // Step 2: Build and Run the RAG Chain (no changes needed here)
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-001",
    apiKey: process.env.GOOGLE_API_KEY,
    streaming: true,
  });
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_API_KEY,
  });
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "persona_vectors",
    queryName: "match_documents",
  });
  const retriever = vectorStore.asRetriever({
    filter: { persona_key: personaKey },
    k: 5,
  });

  const prompt =
    ChatPromptTemplate.fromTemplate(`You are an AI assistant representing a digital persona. Use the following details to inform your personality, tone, and style.
PERSONA DETAILS:
{persona_data}

Now, answer the user's question based ONLY on the following context retrieved from their documents. If the context doesn't contain the answer, say that you don't have enough information from the documents.

CONTEXT:
{context}

QUESTION:
{question}`);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
      persona_data: () => formattedPersonaData,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const result = await chain.stream(msg);
  return result;
}
