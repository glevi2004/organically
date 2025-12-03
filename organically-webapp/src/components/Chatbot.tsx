"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

import { Chat } from "@/components/ui/chat";
import type { Message } from "@/components/ui/chat-message";

export function Chatbot() {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage, stop, setMessages } = useChat();

  const isGenerating = status === "submitted" || status === "streaming";

  // Convert UIMessage[] to Message[] for the Chat component
  const convertedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content:
      msg.parts
        ?.filter(
          (part): part is { type: "text"; text: string } => part.type === "text"
        )
        .map((part) => part.text)
        .join("") ?? "",
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col p-4">
      <Chat
        className="h-full"
        messages={convertedMessages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isGenerating={isGenerating}
        stop={stop}
        setMessages={setMessages as (messages: Message[]) => void}
      />
    </div>
  );
}
