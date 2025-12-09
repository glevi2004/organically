"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { MessageCircle, MessageSquare, Zap, Plus, X } from "lucide-react";
import { TriggerNodeData, TriggerType } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icon and color configuration for each trigger type
const triggerConfig: Record<
  TriggerType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  direct_message: {
    icon: MessageCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  post_comment: {
    icon: MessageSquare,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
};

interface TriggerNodeProps {
  id: string;
  data: TriggerNodeData;
  selected?: boolean;
}

export const TriggerNode = memo(({ id, data, selected }: TriggerNodeProps) => {
  const { setNodes } = useReactFlow();

  const config = triggerConfig[data.type] || {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  };
  const Icon = config.icon;

  // Update node data
  const updateData = useCallback(
    (updates: Partial<TriggerNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [id, setNodes]
  );

  // Handle keyword input
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const keyword = input.value.trim();
      if (keyword && !data.keywords?.includes(keyword)) {
        updateData({ keywords: [...(data.keywords || []), keyword] });
        input.value = "";
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    updateData({ keywords: data.keywords?.filter((k) => k !== keyword) || [] });
  };

  return (
    <div
      className={cn(
        "w-72 rounded-xl border-2 bg-card shadow-xl overflow-hidden",
        "transition-all duration-200",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{data.label}</h3>
          <p className="text-[10px] text-muted-foreground">Trigger</p>
        </div>
      </div>

      {/* Body - Configuration */}
      <div className="p-4 space-y-4">
        {/* Keywords */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Keywords</Label>
          <div className="relative">
            <Input
              placeholder="Type keyword and press Enter..."
              className="h-9 text-sm pr-8"
              onKeyDown={handleKeywordKeyDown}
            />
            <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {data.keywords && data.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-0.5 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Match Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Match Type</Label>
          <Select
            value={data.matchType || "contains"}
            onValueChange={(value: "exact" | "contains" | "starts_with") =>
              updateData({ matchType: value })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="exact">Exact Match</SelectItem>
              <SelectItem value="starts_with">Starts With</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3! h-3! bg-primary! border-2! border-background!"
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
