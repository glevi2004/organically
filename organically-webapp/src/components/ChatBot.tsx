"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useState } from "react";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon, MessageCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { ToolUIPart } from "ai";

const models = [
  {
    name: "GPT-4o Mini",
    value: "openai/gpt-4o-mini",
  },
  {
    name: "GPT-4o",
    value: "openai/gpt-4o",
  },
];

export default function ChatBot() {
  const [input, setInput] = useState(""); // Add local state for input
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState<boolean>(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const onSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage(
        { text: message.text },
        {
          body: {
            model,
            webSearch,
          },
        }
      );
      setInput(""); // Clear input after sending
    }
  };

  return (
    <div className="h-full min-h-0 max-w-4xl mx-auto p-2 relative size-full overflow-hidden max-h-full">
      <div className="flex flex-col h-full min-h-0">
        {/* Messages */}
        <Conversation className="min-h-0">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageCircleIcon className="size-8" />}
                title="Start a conversation"
                description="Ask me anything!"
              />
            ) : (
              messages.map((message) => {
                const sourceUrlParts = message.parts.filter(
                  (part) => part.type === "source-url"
                );
                const hasSources =
                  message.role === "assistant" && sourceUrlParts.length > 0;

                return (
                  <Message key={message.id} from={message.role}>
                    {hasSources && (
                      <Sources>
                        <SourcesTrigger count={sourceUrlParts.length} />
                        <SourcesContent>
                          {sourceUrlParts.map((part, idx) => (
                            <Source
                              key={`${message.id}-source-${idx}`}
                              href={"url" in part ? part.url : "#"}
                              title={"url" in part ? part.url : "Source"}
                            />
                          ))}
                        </SourcesContent>
                      </Sources>
                    )}
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text as string}
                              </MessageResponse>
                            );
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                isStreaming={
                                  message.parts[message.parts.length - 1]
                                    ?.type === "reasoning" &&
                                  status === "streaming"
                                }
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>
                                  {part.text as string}
                                </ReasoningContent>
                              </Reasoning>
                            );
                          case "source-url":
                            // Skip source-url parts here as they're rendered in Sources above
                            return null;
                          default:
                            if (part.type.startsWith("tool-")) {
                              const genericToolPart = part as ToolUIPart;
                              return (
                                <Tool
                                  key={`${message.id}-${i}`}
                                  defaultOpen={true}
                                >
                                  <ToolHeader
                                    type={genericToolPart.type}
                                    state={genericToolPart.state}
                                  />
                                  <ToolContent>
                                    <ToolInput input={genericToolPart.input} />
                                    <ToolOutput
                                      output={
                                        <MessageResponse>
                                          {JSON.stringify(
                                            genericToolPart.output
                                          ).slice(0, 500)}
                                        </MessageResponse>
                                      }
                                      errorText={genericToolPart.errorText}
                                    />
                                  </ToolContent>
                                </Tool>
                              );
                            }
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Prompt Input */}
        <PromptInput onSubmit={onSubmit} className="mt-4 shrink-0">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? "default" : "ghost"}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon className="size-4" />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect onValueChange={setModel} value={model}>
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((m) => (
                    <PromptInputSelectItem key={m.value} value={m.value}>
                      {m.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input.trim()} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
