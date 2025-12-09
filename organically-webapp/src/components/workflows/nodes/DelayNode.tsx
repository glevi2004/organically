"use client";

import { memo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Clock } from "lucide-react";
import { DelayNodeData, DelayUnit } from "@/types/workflow";
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

interface DelayNodeProps {
  id: string;
  data: DelayNodeData;
  selected?: boolean;
}

export const DelayNode = memo(({ id, data, selected }: DelayNodeProps) => {
  const { setNodes } = useReactFlow();

  // Update node data
  const updateData = useCallback((updates: Partial<DelayNodeData>) => {
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
        "w-64 rounded-xl border-2 bg-card shadow-xl overflow-hidden",
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
      <div className="px-4 py-3 border-b flex items-center gap-3 bg-amber-500/10">
        <div className="p-1.5 rounded-lg bg-background/50">
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{data.label}</h3>
          <p className="text-[10px] text-muted-foreground">Wait before next step</p>
        </div>
      </div>

      {/* Body - Configuration */}
      <div className="p-4 space-y-4">
        {/* Duration & Unit */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Wait Duration</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={data.duration || 5}
              onChange={(e) => updateData({ duration: parseInt(e.target.value) || 1 })}
              className="h-9 text-sm w-20"
            />
            <Select
              value={data.unit || 'minutes'}
              onValueChange={(value: DelayUnit) => updateData({ unit: value })}
            >
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

DelayNode.displayName = "DelayNode";
