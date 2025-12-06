import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";

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
    case "openai/gpt-4o-mini":
    default:
      return openai("gpt-4o-mini");
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
    system: "You are a helpful assistant",
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
