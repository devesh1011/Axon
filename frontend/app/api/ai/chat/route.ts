import { personaChat } from "@/lib/server/personaChat";
import { StreamingTextResponse, LangChainStream } from "ai";
import { z } from "zod";

// --- Configuration & Helpers ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Zod schema for request validation
const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .min(1),
  tokenId: z.string(),
});

// --- Main API Route ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ChatSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validation.error.issues,
        }),
        { status: 400 }
      );
    }

    const { messages, tokenId } = validation.data;

    const response = personaChat(messages, tokenId);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof Error) {
      if (error.message.includes("TOKEN_NOT_FOUND")) {
        return new Response(
          JSON.stringify({
            code: "TOKEN_NOT_FOUND",
            message: "Persona token not found",
          }),
          { status: 404 }
        );
      }
      if (error.message.includes("IPFS_ERROR")) {
        return new Response(
          JSON.stringify({
            code: "IPFS_ERROR",
            message: "Failed to fetch persona data from IPFS",
          }),
          { status: 502 }
        );
      }
    }
    return new Response(
      JSON.stringify({
        code: "CHAT_FAILED",
        message: "Failed to process chat request",
      }),
      { status: 500 }
    );
  }
}
