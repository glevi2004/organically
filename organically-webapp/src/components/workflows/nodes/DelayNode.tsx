"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { DelayNodeData } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface DelayNodeProps extends NodeProps {
  data: DelayNodeData;
  selected?: boolean;
}

export const DelayNode = memo(({ data, selected }: DelayNodeProps) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2.5 p-2.5 rounded-lg border-2 bg-card whitespace-nowrap",
        "transition-all duration-200",
        selected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border hover:border-primary/50",
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      <div className="p-1.5 rounded-md bg-amber-500/10 shrink-0">
        <Clock className="w-4 h-4 text-amber-500" />
      </div>
      <span className="text-sm font-medium">{data.label}</span>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';
