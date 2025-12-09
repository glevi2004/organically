"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Send, Reply, Zap } from "lucide-react";
import { ActionNodeData } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Icon and color configuration for each action type
const actionConfig: Record<
  ActionType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  send_message: {
    icon: Send,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  reply_comment: {
    icon: Reply,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
};

interface ActionNodeProps {
  id: string;
  data: ActionNodeData;
  selected?: boolean;
}

export const ActionNode = memo(({ id, data, selected }: ActionNodeProps) => {
  const { setNodes } = useReactFlow();
  
  const config = actionConfig[data.type] || {
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  };
  const Icon = config.icon;

  // Update node data
  const updateData = useCallback((updates: Partial<ActionNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [id, setNodes]);

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
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3! h-3! bg-primary! border-2! border-background!"
      />

      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{data.label}</h3>
          <p className="text-[10px] text-muted-foreground">Action</p>
        </div>
      </div>

      {/* Body - Configuration */}
      <div className="p-4 space-y-4">
        {/* Message Template */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Message</Label>
          <Textarea
            value={data.messageTemplate || ''}
            onChange={(e) => updateData({ messageTemplate: e.target.value })}
            placeholder="Enter your message..."
            className="min-h-[80px] text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground">
            Use {"{{username}}"} to include sender&apos;s name
          </p>
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

ActionNode.displayName = "ActionNode";
