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
            query: z.string().describe("The search query to look up on the web"),
            maxResults: z
              .number()
              .optional()
              .default(5)
              .describe("Maximum number of results to return (1-10)"),
          }),
          execute: executeWebSearch,
        },
      },
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
