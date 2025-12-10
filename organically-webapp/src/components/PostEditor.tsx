"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function PostEditor({
  content,
  onChange,
  placeholder = "What's happening?",
  readOnly = false,
}: PostEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={readOnly}
      className={cn(
        "min-h-[200px] resize-none border border-input rounded-md p-3 text-base bg-background focus-visible:ring-1 focus-visible:ring-ring",
        readOnly && "cursor-not-allowed opacity-60"
      )}
    />
  );
}

