"use client";

import { Bot } from "lucide-react";

export function Chatbot() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
      <p className="text-sm text-muted-foreground">
        This feature is currently in development.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Soon you'll be able to get AI-powered suggestions for your content.
      </p>
    </div>
  );
}
