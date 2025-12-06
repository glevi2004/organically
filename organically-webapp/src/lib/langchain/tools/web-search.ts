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

