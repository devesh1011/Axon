import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Document } from "@langchain/core/documents";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to format retrieved documents from RAG
export const formatDocs = (docs: Document[]): string => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Helper to format the persona metadata object into a readable string
export const formatPersonaData = (data: any): string => {
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

export const formatChatHistory = (
  history: Array<{ role: string; content: string }>
): string => {
  return history
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Persona"}: ${message.content}`
    )
    .join("\n");
};
