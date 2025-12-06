import { DynamicStructuredTool } from "@langchain/core/tools";
import { webSearchSchema, executeWebSearch } from "./web-search";

export { webSearchSchema, executeWebSearch } from "./web-search";
export type { SearchResult, WebSearchOutput } from "./web-search";

// Create the web search tool for LangChain
const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description:
    "Search the web for current information. Use this when you need to find up-to-date information, news, trends, or facts that may not be in your training data.",
  schema: webSearchSchema,
  func: async (input) => {
    const result = await executeWebSearch(input);
    return JSON.stringify(result);
  },
});

// Export all tools as an array for use with LangChain agents
export const tools = [webSearchTool];
