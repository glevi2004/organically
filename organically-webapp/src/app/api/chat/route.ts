import { streamAgentResponse, ChatMessage } from "@/lib/langchain/agent";
import { Profile } from "@/types/profile";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, profile } = await req.json();

    // Validate profile
    if (!profile || !profile.id) {
      return new Response(
        JSON.stringify({ error: "profile is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cast to Profile type (profile is passed from client which already has it)
    const profileData = profile as Profile;

    // Convert incoming messages to ChatMessage format
    const chatMessages: ChatMessage[] = messages.map((msg: { role: string; content?: string; parts?: Array<{ type: string; text: string }> }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content || msg.parts?.filter((p: { type: string }) => p.type === "text").map((p: { text: string }) => p.text).join("") || "",
    }));

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAgentResponse(profileData, chatMessages)) {
            // Format as SSE-compatible data stream for @ai-sdk/react useChat
            const data = JSON.stringify({
              type: "text",
              value: chunk,
            });
            controller.enqueue(encoder.encode(`0:${data}\n`));
          }
          
          // Send finish message
          const finishData = JSON.stringify({
            finishReason: "stop",
            usage: { promptTokens: 0, completionTokens: 0 },
          });
          controller.enqueue(encoder.encode(`d:${finishData}\n`));
          
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
