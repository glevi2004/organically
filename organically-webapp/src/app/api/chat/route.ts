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
  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await req.json();

  const result = streamText({
    model: getModel(model, webSearch),
    messages: convertToModelMessages(messages),
    system: `You are a helpful assistant. Always format your responses using proper Markdown syntax:
- Use code blocks with language tags for code (e.g., \`\`\`python, \`\`\`javascript, \`\`\`typescript)
- Use **bold** for emphasis and *italic* for lighter emphasis
- Use headers (# ## ###) to structure your responses
- Use lists (- or 1.) for items
- Use tables with proper formatting when presenting tabular data
- Use > for blockquotes
- Use \`inline code\` for short code snippets, variable names, or technical terms

Always wrap code examples in proper code blocks with the appropriate language specified.`,
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
