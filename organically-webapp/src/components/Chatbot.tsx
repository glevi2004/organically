"use client";

import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useProfile } from "@/contexts/ProfileContext";
import { Chat } from "@/components/ui/chat";
import type { Message } from "@/components/ui/chat-message";

export function Chatbot() {
  const { activeProfile } = useProfile();
  const [input, setInput] = useState("");

  // Memoize transport to prevent recreation on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { profile: activeProfile },
      }),
    [activeProfile]
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  });

  const isGenerating = status === "streaming" || status === "submitted";

  // Convert AI SDK UIMessage to our Message type for the Chat component
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
    parts: msg.parts as Message["parts"],
    toolInvocations: extractToolInvocations(msg.parts),
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || !activeProfile) return;
    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  if (!activeProfile) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground">
          Select a profile to start chatting
        </p>
      </div>
    );
  }

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
        setMessages={setMessages as any}
      />
    </div>
  );
}

// Extract tool invocations from parts for backward compatibility with chat-message.tsx
function extractToolInvocations(parts: any[] | undefined) {
  if (!parts) return undefined;

  const toolInvocations: any[] = [];

  for (const part of parts) {
    // Check for tool parts (they start with "tool-" or are "dynamic-tool")
    if (
      part.type?.startsWith("tool-") ||
      part.type === "dynamic-tool" ||
      part.type === "tool-invocation"
    ) {
      const toolName =
        part.toolName || part.type?.replace("tool-", "") || "unknown";

      // Map AI SDK 5.0 states to our ToolInvocation states
      let state: "partial-call" | "call" | "result" = "call";
      if (part.state === "output-available" || part.state === "output-error") {
        state = "result";
      } else if (part.state === "input-streaming") {
        state = "partial-call";
      }

      toolInvocations.push({
        toolCallId: part.toolCallId,
        toolName,
        state,
        args: part.input,
        result:
          part.state === "output-error"
            ? { error: part.errorText }
            : part.output,
      });
    }
  }

  return toolInvocations.length > 0 ? toolInvocations : undefined;
}
