"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Message, ChatPanelProps } from "@/lib/types";

export function ChatPanel({ tokenId, personaName }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: `Hello! I'm ${personaName}. Ask me anything about the documents I've been trained on.`,
      parts: [
        {
          type: "text",
          text: `Hello! I'm ${personaName}. Ask me anything about the documents I've been trained on.`,
        },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message within the chat container only
  const scrollToBottom = () => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      // Use the scroll area's viewport for scrolling
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        // Ensure scrolling is contained within the chat
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      parts: [{ type: "text", text: input.trim() }],
    };

    // Add the user's message and limit to the last 10 messages for better UX
    const updatedMessages = [...messages, newUserMessage]
      .slice(-10)
      .map((msg) => ({
        ...msg,
        parts:
          msg.parts && Array.isArray(msg.parts)
            ? msg.parts
            : [{ type: "text", text: msg.content }],
      }));
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          tokenId: tokenId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "An API error occurred.");
      }

      const data = await response.json();
      if (!data.answer) {
        throw new Error("No answer in response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        parts: [{ type: "text", text: data.answer }],
      };
      setMessages((prev) => [...prev, assistantMessage].slice(-10));
    } catch (error) {
      console.error("[ChatPanel] Chat error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="glass h-full flex flex-col overflow-hidden max-h-[800px]">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-border/50 flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <h3 className="font-semibold text-neon-cyan">{personaName}</h3>
            <p className="text-xs text-muted-foreground">
              AI Persona • Token #{tokenId}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable with constrained height */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-neon-cyan to-neon-magenta text-background"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {(Array.isArray(message.parts)
                      ? message.parts
                      : [{ type: "text", text: message.content }]
                    )
                      .filter(
                        (part) =>
                          part.type === "text" && typeof part.text === "string"
                      )
                      .map((part, index) => (
                        <div key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </div>
                      ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed */}
      <div className="p-4 border-t border-border/50 flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <form onSubmit={handleFormSubmit}>
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${personaName} anything...`}
              disabled={isLoading}
              className="flex-1"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="sm"
              className="neon-glow-cyan px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Responses are based on uploaded persona data
          </p>
        </form>
      </div>
    </Card>
  );
}
