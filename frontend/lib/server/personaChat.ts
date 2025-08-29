// lib/server/persona-chat.ts
import { supabase } from "@/lib/supabase";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";

// Helper function to format the retrieved documents into a single string.
const formatDocs = (docs: Document[]) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Main RAG chat function
export async function personaChat(msg: string, personaKey: string) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not found in environment variables.");
  }

  // 1. Initialize the necessary components
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
  });

  // 2. Set up the Supabase vector store to act as the retriever
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "persona_vectors",
    queryName: "match_documents",
  });

  // Create a retriever that filters by the specific persona
  // This is the most critical step for retrieving the correct documents.
  const retriever = vectorStore.asRetriever({
    filter: {
      persona_key: personaKey,
    },
    k: 5, // Retrieve the top 5 most relevant documents
  });

  // 3. Define the prompt template for augmenting the query
  const prompt = ChatPromptTemplate.fromTemplate(`
    You are an AI assistant representing a digital persona. Answer the user's question based ONLY on the following context.
    If the context doesn't contain the answer, say that you don't have enough information. Do not make up information.

    CONTEXT:
    {context}

    QUESTION:
    {question}
  `);

  // 4. Build the RAG chain using LangChain Expression Language (LCEL)
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const chain2 = prompt | llm | new StringOutputParser();

  // 5. Invoke the chain with the user's message
  const result = await chain.invoke(msg);

  return result;
}
