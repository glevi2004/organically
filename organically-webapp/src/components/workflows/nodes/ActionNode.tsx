"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Send, 
  Sparkles, 
  Reply, 
  ListPlus,
  Webhook,
  Mail,
  Zap 
} from 'lucide-react';
import { ActionNodeData, ActionType } from '@/types/workflow';
import { cn } from '@/lib/utils';

// Icon and color configuration for each action type
const actionConfig: Record<ActionType, { 
  icon: React.ElementType; 
  color: string; 
  bg: string;
}> = {
  send_dm: { icon: Send, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  send_ai_response: { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  reply_comment: { icon: Reply, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  add_to_list: { icon: ListPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  webhook: { icon: Webhook, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  send_email: { icon: Mail, color: 'text-red-500', bg: 'bg-red-500/10' },
};

interface ActionNodeProps extends NodeProps {
  data: ActionNodeData;
  selected?: boolean;
}

export const ActionNode = memo(({ data, selected }: ActionNodeProps) => {
  const config = actionConfig[data.type] || { 
    icon: Zap, 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-500/10' 
  };
  const Icon = config.icon;

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

      <div className={cn("p-1.5 rounded-md shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
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

ActionNode.displayName = 'ActionNode';
