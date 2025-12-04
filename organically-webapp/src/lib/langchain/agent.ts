import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { Profile } from "@/types/profile";
import { buildProfileContext } from "./context";
import { tools } from "./tools";

// Message type for chat history
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Create a configured LangChain agent with profile context
 */
export function createAgent(profile: Profile) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    streaming: true,
  });

  // If we have tools, bind them to the model
  const boundModel = tools.length > 0 ? model.bindTools(tools) : model;

  // Build the system prompt with profile context
  const systemPrompt = buildProfileContext(profile);

  return {
    model: boundModel,
    systemPrompt,
  };
}

/**
 * Convert chat messages to LangChain message format
 */
export function convertToLangChainMessages(
  messages: ChatMessage[],
  systemPrompt: string
): BaseMessage[] {
  const langChainMessages: BaseMessage[] = [new SystemMessage(systemPrompt)];

  for (const msg of messages) {
    if (msg.role === "user") {
      langChainMessages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      langChainMessages.push(new AIMessage(msg.content));
    }
    // Skip system messages as we already added our system prompt
  }

  return langChainMessages;
}

/**
 * Stream a response from the agent
 */
export async function* streamAgentResponse(
  profile: Profile,
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const { model, systemPrompt } = createAgent(profile);
  const langChainMessages = convertToLangChainMessages(messages, systemPrompt);

  const stream = await model.stream(langChainMessages);

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content as string;
    }
  }
}

