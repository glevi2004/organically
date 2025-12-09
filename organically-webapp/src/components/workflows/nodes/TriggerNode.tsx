"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  MessageCircle, 
  AtSign, 
  UserPlus, 
  Star, 
  MessageSquare,
  Calendar,
  Zap 
} from 'lucide-react';
import { TriggerNodeData, TriggerType } from '@/types/workflow';
import { cn } from '@/lib/utils';

// Icon and color configuration for each trigger type
const triggerConfig: Record<TriggerType, { 
  icon: React.ElementType; 
  color: string; 
  bg: string;
}> = {
  dm_keyword: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  comment_keyword: { icon: AtSign, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  new_follower: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' },
  story_mention: { icon: Star, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  story_reply: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  scheduled: { icon: Calendar, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

interface TriggerNodeProps extends NodeProps {
  data: TriggerNodeData;
  selected?: boolean;
}

export const TriggerNode = memo(({ data, selected }: TriggerNodeProps) => {
  const config = triggerConfig[data.type] || { 
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

TriggerNode.displayName = 'TriggerNode';
