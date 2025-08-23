export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { type NextRequest, NextResponse } from "next/server";
import {
  fetchTokenMetadata,
  getTokenURI,
} from "../../../../lib/server/viem-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ChatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { message, tokenId, conversationHistory } = validation.data;

    try {
      // First, verify the token exists and get its metadata
      const tokenMetadata = await fetchTokenMetadata(tokenId);

      if (!tokenMetadata) {
        return NextResponse.json(
          {
            error: {
              code: "TOKEN_NOT_FOUND",
              message: "Persona token not found",
            },
          },
          { status: 404 }
        );
      }

      // Get the token URI for primary content
      const tokenURI = await getTokenURI(tokenId);

      // Extract CID from token URI
      const primaryCid = tokenURI.startsWith("ipfs://")
        ? tokenURI.replace("ipfs://", "")
        : tokenURI;

      // Get additional CIDs from metadata if available
      const linkedCids: string[] = [];
      if (tokenMetadata.files && Array.isArray(tokenMetadata.files)) {
        linkedCids.push(
          ...tokenMetadata.files.map((f: any) => f.cid || f).filter(Boolean)
        );
      }

      // Chat with the persona using LangChain + Gemini
      const response = await chatWithPersona({
        tokenURI,
        primaryCid,
        linkedCids,
        question: message,
        personaName: tokenMetadata.name,
        personaDescription: tokenMetadata.description,
      });

      return NextResponse.json({
        response: response.answer,
        citations: response.citations,
        tokenId,
        timestamp: new Date().toISOString(),
        conversationId: `${tokenId}-${Date.now()}`, // Simple conversation ID
      });
    } catch (error) {
      console.error("AI chat error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Token not found")) {
          return NextResponse.json(
            {
              error: {
                code: "TOKEN_NOT_FOUND",
                message: "Persona token not found",
              },
            },
            { status: 404 }
          );
        }

        if (error.message.includes("IPFS")) {
          return NextResponse.json(
            {
              error: {
                code: "IPFS_ERROR",
                message: "Failed to fetch persona data from IPFS",
              },
            },
            { status: 502 }
          );
        }
      }

      return NextResponse.json(
        {
          error: {
            code: "AI_ERROR",
            message: "Failed to generate AI response",
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: error.message } },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "CHAT_FAILED",
          message: "Failed to process chat request",
        },
      },
      { status: 500 }
    );
  }
}
