"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { ConditionNodeData, ConditionField, ConditionOperator } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConditionNodeProps {
  id: string;
  data: ConditionNodeData;
  selected?: boolean;
}

export const ConditionNode = memo(({ id, data, selected }: ConditionNodeProps) => {
  const { setNodes } = useReactFlow();

  // Update node data
  const updateData = useCallback((updates: Partial<ConditionNodeData>) => {
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
        <div className="p-1.5 rounded-md bg-yellow-500/10">
          <GitBranch className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{data.label}</h3>
          <p className="text-[10px] text-muted-foreground">Condition</p>
        </div>
      </div>

      {/* Body - Configuration */}
      <div className="p-4 space-y-4">
        {/* Field */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">If</Label>
          <Select
            value={data.field}
            onValueChange={(value: ConditionField) => updateData({ field: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="username">Username</SelectItem>
              <SelectItem value="follower_count">Follower Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Operator */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Operator</Label>
          <Select
            value={data.operator}
            onValueChange={(value: ConditionOperator) => updateData({ operator: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="not_contains">Does not contain</SelectItem>
              <SelectItem value="equals">Equals</SelectItem>
              <SelectItem value="not_equals">Does not equal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Value</Label>
          <Input
            value={data.value}
            onChange={(e) => updateData({ value: e.target.value })}
            placeholder="Enter value..."
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Output Handles - True (top) and False (bottom) */}
      <div className="relative">
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          style={{ top: -60 }}
          className="w-3! h-3! bg-green-500! border-2! border-background!"
        />
        <div className="absolute right-6 -top-[68px] text-[10px] text-green-500 font-medium">
          Yes
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          style={{ top: -20 }}
          className="w-3! h-3! bg-red-500! border-2! border-background!"
        />
        <div className="absolute right-6 -top-[28px] text-[10px] text-red-500 font-medium">
          No
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";

