# Web Search Tool Implementation Plan

## Overview

This plan implements a web search tool using the **Vercel AI SDK 5.0** pattern — the modern, maintainable approach that handles streaming, tool invocations, and multi-step loops automatically.

---

## Current State Analysis

**Installed packages:**

- `@ai-sdk/react: ^2.0.51` - React hooks (useChat)
- `@ai-sdk/openai: ^2.0.76` - OpenAI provider

**Current implementation issues:**

- `Chatbot.tsx` manually parses SSE streams instead of using `useChat`
- `route.ts` manually encodes SSE format instead of using `streamText().toUIMessageStreamResponse()`
- `chat-message.tsx` already supports AI SDK format (`parts`, `toolInvocations`) ✅

---

## Architecture Comparison

| Approach                              | Lines of Code | Maintenance | Reliability   |
| ------------------------------------- | ------------- | ----------- | ------------- |
| ❌ Current (manual SSE parsing)       | ~150+         | High        | Brittle       |
| ✅ **AI SDK v5 useChat + streamText** | ~50           | Low         | Battle-tested |

---

## Implementation Steps

### Phase 1: Environment Setup

Add to `.env.local`:

```bash
# Tavily API (free tier: 1,000 searches/month)
# Get key from: https://tavily.com
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

---

### Phase 2: Create Web Search Tool

#### 2.1 Create `src/lib/langchain/tools/web-search.ts`

```typescript
import { z } from "zod";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface WebSearchOutput {
  query: string;
  results: SearchResult[];
  answer?: string;
  error?: string;
}

export const webSearchSchema = z.object({
  query: z.string().describe("The search query to look up on the web"),
  maxResults: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum number of results to return (1-10)"),
});

export async function executeWebSearch({
  query,
  maxResults = 5,
}: z.infer<typeof webSearchSchema>): Promise<WebSearchOutput> {
  if (!TAVILY_API_KEY) {
    return {
      query,
      results: [],
      error: "TAVILY_API_KEY is not configured",
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: Math.min(maxResults, 10),
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      query,
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
      answer: data.answer,
    };
  } catch (error) {
    console.error("Web search error:", error);
    return {
      query,
      results: [],
      error: "Failed to perform web search",
    };
  }
}
```

#### 2.2 Update `src/lib/langchain/tools/index.ts`

```typescript
export { webSearchSchema, executeWebSearch } from "./web-search";
export type { SearchResult, WebSearchOutput } from "./web-search";
```

---

### Phase 3: Update API Route (Using AI SDK 5.0)

Replace the entire `src/app/api/chat/route.ts`:

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { z } from "zod";
import { Profile } from "@/types/profile";
import { buildProfileContext } from "@/lib/langchain/context";
import { executeWebSearch } from "@/lib/langchain/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, profile }: { messages: UIMessage[]; profile: Profile } =
      await req.json();

    if (!profile || !profile.id) {
      return new Response(JSON.stringify({ error: "profile is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildProfileContext(profile);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools: {
        web_search: {
          description: `Search the web for current information. Use this tool when you need:
            - Real-time data (news, trends, current events)
            - Information about recent topics the model might not know
            - Fact-checking or verification
            - Research on specific topics, brands, or competitors
            - Social media trends and viral content ideas`,
          inputSchema: z.object({
            query: z
              .string()
              .describe("The search query to look up on the web"),
            maxResults: z
              .number()
              .optional()
              .default(5)
              .describe("Maximum number of results to return (1-10)"),
          }),
          execute: executeWebSearch,
        },
      },
      stopWhen: stepCountIs(5), // Replaces maxSteps in AI SDK 5.0
    });

    return result.toUIMessageStreamResponse(); // AI SDK 5.0 method
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

---

### Phase 4: Update Chatbot Component (Using useChat from @ai-sdk/react)

Replace `src/components/Chatbot.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useProfile } from "@/contexts/ProfileContext";
import { Chat } from "@/components/ui/chat";
import type { Message } from "@/components/ui/chat-message";

export function Chatbot() {
  const { activeProfile } = useProfile();
  const [input, setInput] = useState(""); // AI SDK 5.0: manage input yourself

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { profile: activeProfile },
    }),
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
    sendMessage({ text: input }); // AI SDK 5.0: use sendMessage
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

// Extract tool invocations from parts for backward compatibility
function extractToolInvocations(parts: any[] | undefined) {
  if (!parts) return undefined;

  const toolInvocations: any[] = [];

  for (const part of parts) {
    if (
      part.type?.startsWith("tool-") ||
      part.type === "dynamic-tool" ||
      part.type === "tool-invocation"
    ) {
      const toolName =
        part.toolName || part.type?.replace("tool-", "") || "unknown";

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
```

---

### Phase 5: Enhanced Web Search Result UI (Optional)

Create `src/components/ui/web-search-result.tsx` for a Cursor-style tool UI:

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { WebSearchOutput } from "@/lib/langchain/tools";

interface WebSearchResultProps {
  state: "partial-call" | "call" | "result";
  args?: { query?: string; maxResults?: number };
  result?: WebSearchOutput;
}

export function WebSearchResult({ state, args, result }: WebSearchResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isLoading = state === "call" || state === "partial-call";

  return (
    <div className="my-2 w-full sm:max-w-[85%]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "rounded-lg border bg-muted/30 transition-colors",
            isLoading && "border-blue-500/50 bg-blue-500/5"
          )}
        >
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-90"
                )}
              />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="font-medium text-sm">Web Search</span>
              </div>
              {args?.query && (
                <span className="text-sm text-muted-foreground truncate flex-1 max-w-[200px]">
                  &quot;{args.query}&quot;
                </span>
              )}
              <div className="ml-auto">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : result?.error ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t px-3 py-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching the web...
                  </div>
                ) : result ? (
                  <div className="space-y-3">
                    {result.answer && (
                      <div className="rounded-md bg-primary/5 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Summary
                        </p>
                        <p className="text-sm">{result.answer}</p>
                      </div>
                    )}

                    {result.results && result.results.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {result.results.length} sources found
                        </p>
                        {result.results.slice(0, 3).map((item, i) => (
                          <a
                            key={i}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-md border p-2 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {item.content}
                                </p>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {result.error && (
                      <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                        {result.error}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
```

---

## AI SDK 5.0 Key API Differences

```typescript
// ❌ OLD (AI SDK 4.x / ai/react)
import { useChat } from "ai/react";
const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
  useChat({
    api: "/api/chat",
    body: { profile },
    maxSteps: 5,
  });

// ✅ NEW (AI SDK 5.0 / @ai-sdk/react)
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
const [input, setInput] = useState(""); // Manage input yourself!
const { messages, sendMessage, status, stop, setMessages } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
    body: { profile },
  }),
});
const isGenerating = status === "streaming" || status === "submitted";

// Submit with:
sendMessage({ text: input });
```

```typescript
// ❌ OLD API Route
import { streamText, convertToCoreMessages, tool } from "ai";
const result = streamText({
  messages: convertToCoreMessages(messages),
  tools: {
    myTool: tool({
      parameters: z.object({ ... }),
      execute: async (args) => { ... },
    }),
  },
  maxSteps: 5,
});
return result.toDataStreamResponse();

// ✅ NEW API Route (AI SDK 5.0)
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
const result = streamText({
  messages: convertToModelMessages(messages),
  tools: {
    myTool: {
      inputSchema: z.object({ ... }),
      execute: async (args) => { ... },
    },
  },
  stopWhen: stepCountIs(5),
});
return result.toUIMessageStreamResponse();
```

---

## File Structure Summary

```
src/
├── lib/langchain/
│   ├── context.ts              # Unchanged - profile context builder
│   ├── agent.ts                # Can be DELETED - no longer needed
│   └── tools/
│       ├── index.ts            # Export tools
│       └── web-search.ts       # NEW - Tavily web search
├── app/api/chat/
│   └── route.ts                # REPLACED - Uses AI SDK 5.0 streamText
└── components/
    ├── Chatbot.tsx             # REPLACED - Uses useChat hook
    └── ui/
        ├── chat-message.tsx    # Unchanged - already supports parts/toolInvocations
        └── web-search-result.tsx # NEW (optional) - Cursor-style UI
```

---

## Key Benefits of This Approach

| Feature             | Current (Manual)                   | AI SDK 5.0                                |
| ------------------- | ---------------------------------- | ----------------------------------------- |
| Streaming Protocol  | Manual `0:{json}` encoding/parsing | Automatic via `toUIMessageStreamResponse` |
| Tool State Tracking | Not implemented                    | `parts` with typed tool states            |
| Multi-step Loops    | Not implemented                    | `stopWhen: stepCountIs(5)`                |
| Abort/Cancel        | Manual AbortController             | Built into `useChat`                      |
| Type Safety         | Manual typing                      | Full TypeScript inference                 |
| Message Format      | Manual conversion                  | Native `parts` array support              |

---

## Testing Checklist

- [ ] `TAVILY_API_KEY` is set in `.env.local`
- [ ] Agent correctly decides when to search (vs. answering directly)
- [ ] Tool card shows "Searching..." state with spinner
- [ ] Tool card expands to show results with clickable links
- [ ] Multi-step works (search → synthesize → respond)
- [ ] Stop button cancels ongoing requests

---

## Example Prompts to Test

1. "What are the latest Instagram algorithm changes in 2024?"
2. "Search for viral TikTok trends this week for fitness creators"
3. "What's the best time to post on LinkedIn according to recent studies?"
4. "Find news about creator monetization on YouTube"

---

## Future Enhancements

1. **More Tools** - Add `create_post`, `get_ideas`, `schedule_post` tools
2. **Tool Confirmation** - Use client-side tools with `addToolOutput` for user confirmation
3. **Caching** - Cache recent searches with React Query or SWR
4. **Rate Limiting** - Track API usage per profile
5. **Tool History** - Persist tool results for conversation continuity
