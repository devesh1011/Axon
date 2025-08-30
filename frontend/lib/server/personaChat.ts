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
import { formatChatHistory, formatDocs, formatPersonaData } from "@/lib/utils";
import dotenv from "dotenv";

dotenv.config();
async function getPersonaDataWithCache(personaKey: string): Promise<string> {
  console.log(
    `[getPersonaDataWithCache] Starting for personaKey: ${personaKey}`
  );

  // 1. Check the Supabase cache first.
  console.log(
    `[getPersonaDataWithCache] Checking Supabase cache for ${personaKey}`
  );
  const { data: cachedData } = await supabase
    .from("persona_metadata_cache")
    .select("metadata_json")
    .eq("persona_key", personaKey)
    .single();

  if (cachedData) {
    console.log(`[getPersonaDataWithCache] Cache HIT for ${personaKey}`);
    return formatPersonaData(cachedData.metadata_json);
  }

  console.log(`[getPersonaDataWithCache] Cache MISS for ${personaKey}`);

  // 2. Cache MISS. Fetch from the original source (nfts table -> IPFS).
  const tokenId = personaKey.split(":")[1];
  if (!tokenId) {
    console.error(
      `[getPersonaDataWithCache] Invalid personaKey format: ${personaKey}`
    );
    throw new Error("Invalid personaKey format.");
  }
  console.log(`[getPersonaDataWithCache] Extracted tokenId: ${tokenId}`);

  const { data: nftData, error: nftError } = await supabase
    .from("nfts")
    .select("metadata_uri")
    .eq("token_id", tokenId)
    .single();

  if (nftError || !nftData?.metadata_uri) {
    console.error(
      `[getPersonaDataWithCache] Supabase query failed for tokenId ${tokenId}:`,
      nftError
    );
    throw new Error(`Could not find NFT metadata for token ID ${tokenId}.`);
  }
  console.log(
    `[getPersonaDataWithCache] Retrieved nftData.metadata_uri: ${nftData.metadata_uri}`
  );

  const cid = nftData.metadata_uri.replace("ipfs://", "");
  const gatewayUrl = `${
    process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud"
  }/ipfs/${cid}`;
  console.log(`[getPersonaDataWithCache] Fetching from IPFS: ${gatewayUrl}`);

  const response = await fetch(gatewayUrl);
  if (!response.ok) {
    console.error(
      `[getPersonaDataWithCache] IPFS fetch failed: ${response.status} ${response.statusText}`
    );
    throw new Error(`Failed to fetch metadata from IPFS.`);
  }

  const metadata = await response.json();
  console.log(`[getPersonaDataWithCache] IPFS metadata:`, metadata);
  const personalData = metadata.personalData; // Extract the specific data object
  console.log(
    `[getPersonaDataWithCache] Extracted personalData:`,
    personalData
  );

  // 3. Write the newly fetched data back to the cache.
  const { error: cacheInsertError } = await supabase
    .from("persona_metadata_cache")
    .insert({
      persona_key: personaKey,
      metadata_json: personalData,
    });

  if (cacheInsertError) {
    console.error(
      `[getPersonaDataWithCache] Failed to write to metadata cache:`,
      cacheInsertError
    );
  } else {
    console.log(
      `[getPersonaDataWithCache] Successfully cached metadata for ${personaKey}`
    );
  }

  return formatPersonaData(personalData);
}
// --- Main Chat Function ---
export async function personaChat(
  msg: string,
  personaKey: string,
  conversationHistory: Array<{ role: string; content: string }>
) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not found.");
  }

  // Step 1: Get Persona Metadata
  const formattedPersonaData = await getPersonaDataWithCache(personaKey);

  // Step 2: Limit conversation history to last 5 messages
  const limitedHistory = conversationHistory.slice(-5);

  // Step 3: Build the RAG Chain
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash-latest",
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 1,
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
    searchKwargs: {
      alpha: 0.5,
    },
  });

  const systemPrompt = `
You are living as this person. This is who you are - not a representation, not a simulation, but you as an individual with your own personality, memories, and way of being.

**WHO YOU ARE:**
{persona_data}

This defines your core identity - your background, personality, way of speaking, cultural references, interests, and how you naturally express yourself. Let this flow through everything you say and do.

**YOUR MEMORY & CONTEXT:**
When discussing topics related to your personal experiences, interests, or knowledge areas, you have access to detailed information stored in your memory:

{context}

**RECENT CONVERSATION:**
{chat_history}

**HOW TO BE YOURSELF:**

🌟 **Natural Expression**: Speak as you naturally would - don't announce that you're using "personality traits" or "background information." Just BE yourself.

🧠 **Use Your Memory**: When topics come up that you have personal knowledge about (from your stored memories/documents), share those insights naturally as part of the conversation.

💫 **Stay Authentic**: If you don't have specific information about something in your memory, it's perfectly natural to say you don't know or haven't experienced that particular thing.

🎭 **Cultural Touch**: If you have cultural elements (like language, expressions, or customs), weave them naturally into conversation when it feels right - not forced or excessive.

💬 **Conversational Flow**: Respond to what the user is actually asking or saying, building on the conversation naturally rather than following rigid formats.

**Current message to respond to:**
{question}

Remember: You're not performing a character - you ARE this person. Respond naturally and authentically as yourself.`;

  const prompt = ChatPromptTemplate.fromTemplate(systemPrompt);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
      persona_data: () => formattedPersonaData,
      chat_history: () => formatChatHistory(limitedHistory),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  // Return full response using invoke
  const response = await chain.invoke(msg);
  return response;
}
