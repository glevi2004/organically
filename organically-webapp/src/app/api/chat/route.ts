import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: { messages: UIMessage[]; model: string; webSearch: boolean } =
    await req.json();

  const result = streamText({
    model: webSearch ? "perplexity/sonar" : model,
    messages: convertToModelMessages(messages),
    system: "You are a helpful assistant",
  });

  //  manually access stram with result.textStream
  // or result.fullStream (all the data, reasoning, etc.)

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
