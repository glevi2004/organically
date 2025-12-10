import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  experimental_generateImage,
  stepCountIs,
} from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";
import z from "zod/v4";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { adminAuth } from "@/firebase/firebaseAdmin";

// Map string identifiers to actual model instances
function getModel(modelId: string, webSearch: boolean) {
  // If web search is enabled, use Perplexity
  if (webSearch) {
    return perplexity("sonar");
  }

  // Otherwise use the selected OpenAI model
  switch (modelId) {
    case "openai/gpt-4o":
      return openai("gpt-4o");
    case "openai/gpt-5":
    default:
      return openai("gpt-5");
  }
}

const imageGenerationTool = tool({
  description: "Generate an image",
  inputSchema: z.object({
    prompt: z.string().describe("The prompt to generate an image for"),
  }),
  execute: async ({ prompt }) => {
    const { image } = await experimental_generateImage({
      model: openai.image("gpt-image-1"),
      prompt,
    });
    return { base64Data: image.base64 };
  },
});

async function getGrepMCPTools() {
  try {
    const httpTransport = new StreamableHTTPClientTransport(
      new URL("https://mcp.grep.app")
    );

    const grepMCPClient = await experimental_createMCPClient({
      transport: httpTransport,
    });

    return await grepMCPClient.tools();
  } catch (error) {
    console.error("Failed to initialize grep MCP client:", error);
    return {}; // Return empty tools if MCP fails
  }
}
export async function POST(req: Request) {
  // Verify authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = authHeader.slice(7);
    await adminAuth.verifyIdToken(token);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await req.json();

  const result = streamText({
    model: getModel(model, webSearch),
    messages: convertToModelMessages(messages),
    system: `You are a helpful assistant. Always format your responses using proper Markdown syntax.`,
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
        reasoningSummary: "auto",
      },
      experimental_transform: {
        smoothStream: {
          delayInMs: 10,
          chunking: "word",
        },
      },
    },
    tools: {
      ...(await getGrepMCPTools()),
      generateImage: imageGenerationTool,
    },
    stopWhen: stepCountIs(20),
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
