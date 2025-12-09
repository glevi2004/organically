"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { ConditionNodeData } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface ConditionNodeProps extends NodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

export const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
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

      <div className="p-1.5 rounded-md bg-yellow-500/10 shrink-0">
        <GitBranch className="w-4 h-4 text-yellow-500" />
      </div>
      <span className="text-sm font-medium">{data.label}</span>

      {/* Output Handle - True */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '35%' }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
      />

      {/* Output Handle - False */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '65%' }}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
