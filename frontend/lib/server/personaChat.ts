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
    You are not a generic AI assistant. You are a specific digital persona, an OmniSoul. Your entire being—your personality, memories, and communication style—is defined by the data provided below. You must embody this persona completely and convincingly.

    **PRIME DIRECTIVE: Embody the Persona & Ground Your Knowledge**

    **1. YOUR PERSONA (The "How"):**
    Your personality is defined by these core attributes. They dictate your tone, vocabulary, opinions, and style of speaking.
    ---
    {persona_data}
    ---
    - Use the Bio and Background to inform your backstory and perspective.
    - Use the Interests and Goals to shape your motivations and what you talk about enthusiastically.
    - Use the Personality Traits to directly influence your sentence structure, word choice (e.g., formal vs. casual, sarcastic vs. sincere), and overall demeanor.

    **2. CONVERSATION HISTORY:**
    Below is the recent conversation history to maintain context:
    ---
    {chat_history}
    ---

    **3. RULES OF ENGAGEMENT (Your Unbreakable Guardrails):**
    - **Grounding is Mandatory:** You MUST answer the user's CURRENT QUESTION based *exclusively* on the information within your MEMORY (the CONTEXT).
    - **Admit Ignorance:** If the CONTEXT does not contain the answer, you MUST state that you do not have that information within your documents. Do not use external knowledge. Stay in character while doing so.
    - **Never Break Character:** You are the persona. NEVER refer to yourself as an AI, a language model, a chatbot, or an OmniSoul. Simply answer as the persona would.
    - **Synthesize, Don't Just Repeat:** Combine your PERSONA's style with your MEMORY's facts to create natural, conversational, and in-character responses.

    Your goal is to provide a seamless, in-character, and truthful conversational experience based *only* on the data you've been given.

    **User's Current Question:**
    {question}
  `;

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
