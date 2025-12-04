"use client";

import { useState, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext";

import { Chat } from "@/components/ui/chat";
import type { Message } from "@/components/ui/chat-message";

interface ChatMessagePart {
  type: "text";
  text: string;
}

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts?: ChatMessagePart[];
}

export function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { activeProfile } = useProfile();

  // Convert UIMessage[] to Message[] for the Chat component
  const convertedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content:
      msg.parts
        ?.filter((part): part is ChatMessagePart => part.type === "text")
        .map((part) => part.text)
        .join("") ?? "",
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!activeProfile || !userMessage.trim()) return;

      const userMsg: UIMessage = {
        id: Date.now().toString(),
        role: "user",
        parts: [{ type: "text", text: userMessage }],
      };

      const assistantMsgId = (Date.now() + 1).toString();

      // Only add user message first - assistant message will be added when we get content
      setMessages((prev) => [...prev, userMsg]);
      setIsGenerating(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.parts?.map((p) => p.text).join("") ?? "",
            })),
            profile: activeProfile,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let accumulatedText = "";
        let assistantMessageAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            // Parse SSE format: 0:{json} for text, d:{json} for done
            if (line.startsWith("0:")) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.value) {
                  accumulatedText += data.value;

                  if (!assistantMessageAdded) {
                    // Add assistant message on first chunk
                    assistantMessageAdded = true;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: assistantMsgId,
                        role: "assistant",
                        parts: [{ type: "text", text: accumulatedText }],
                      },
                    ]);
                  } else {
                    // Update existing assistant message
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg.role === "assistant") {
                        lastMsg.parts = [
                          { type: "text", text: accumulatedText },
                        ];
                      }
                      return updated;
                    });
                  }
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [activeProfile, messages]
  );

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || !activeProfile) return;
    const messageText = input.trim();
    setInput("");
    sendMessage(messageText);
  };

  const stop = useCallback(() => {
    // TODO: Implement abort controller for stopping generation
    setIsGenerating(false);
  }, []);

  // Show message if no profile is selected
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
        setMessages={setMessages as unknown as (messages: Message[]) => void}
      />
    </div>
  );
}
