// api/ai/chat/route.ts
import { personaChat } from "@/lib/server/personaChat";
import { z } from "zod";
import { NextResponse } from "next/server";
import { pRateLimit } from "p-ratelimit";

// Runtime settings
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Rate limiter to prevent 429 errors
const limiter = pRateLimit({ interval: 60 * 1000, rate: 15 });

// Define schema for validation
const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
        parts: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .min(1),
  tokenId: z.string(),
});

export async function POST(req: Request) {
  try {
    return limiter(async () => {
      const body = await req.json();
      console.log("[POST /api/ai/chat] Received body:", body);

      const validation = ChatSchema.safeParse(body);
      if (!validation.success) {
        console.error(
          "[POST /api/ai/chat] Validation failed:",
          validation.error.issues
        );
        return NextResponse.json(
          {
            error: "Invalid request data",
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { messages, tokenId } = body;
      const personaKey = `persona:${tokenId}`;
      console.log("[POST /api/ai/chat] personaKey:", personaKey);

      // Convert message parts into single string content
      const modelMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: (Array.isArray(msg.parts) ? msg.parts : [])
          .filter((p: any) => p.type === "text" && typeof p.text === "string")
          .map((p: any) => p.text)
          .join(" "),
      }));

      const last = modelMessages[modelMessages.length - 1];
      const currentMessage = last.content;
      const conversationHistory = modelMessages.slice(-6, -1);
      console.log("[POST /api/ai/chat] currentMessage:", currentMessage);
      console.log(
        "[POST /api/ai/chat] conversationHistory:",
        conversationHistory
      );

      // Get the full response from personaChat
      const answer = await personaChat(
        currentMessage,
        personaKey,
        conversationHistory
      );
      console.log("[POST /api/ai/chat] Answer:", answer);

      if (!answer) {
        console.warn("[POST /api/ai/chat] Empty response from personaChat");
        return NextResponse.json(
          { code: "NO_RESPONSE", message: "No response from the model" },
          { status: 500 }
        );
      }

      // Return JSON response compatible with ChatPanel.tsx
      return NextResponse.json({
        answer, // Matches data.answer in ChatPanel.tsx
      });
    });
  } catch (error: any) {
    console.error("[POST /api/ai/chat] Error:", error);
    if (error.message.includes("TOKEN_NOT_FOUND")) {
      return NextResponse.json(
        { code: "TOKEN_NOT_FOUND", message: "Persona token not found" },
        { status: 404 }
      );
    }
    if (error.message.includes("IPFS_ERROR")) {
      return NextResponse.json(
        {
          code: "IPFS_ERROR",
          message: "Failed to fetch persona data from IPFS",
        },
        { status: 502 }
      );
    }
    if (error.message.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { code: "CHAT_FAILED", message: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
