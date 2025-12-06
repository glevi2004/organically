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
          {/* Header */}
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

          {/* Content */}
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
                    {/* AI Summary */}
                    {result.answer && (
                      <div className="rounded-md bg-primary/5 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Summary
                        </p>
                        <p className="text-sm">{result.answer}</p>
                      </div>
                    )}

                    {/* Search Results */}
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

                    {/* Error */}
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

