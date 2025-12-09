"use client";

import { DragEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  AtSign, 
  UserPlus,
  Star,
  Send, 
  Sparkles, 
  Reply,
  Webhook,
  GitBranch, 
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  triggerTemplates, 
  actionTemplates, 
  logicTemplates,
  NodeTemplate,
} from '@/types/workflow';

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  MessageCircle,
  AtSign,
  UserPlus,
  Star,
  Send,
  Sparkles,
  Reply,
  Webhook,
  GitBranch,
  Clock,
  Zap,
};

// Color classes for each color name
const colorClasses: Record<string, { text: string; bg: string }> = {
  blue: { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  orange: { text: 'text-orange-500', bg: 'bg-orange-500/10' },
  green: { text: 'text-green-500', bg: 'bg-green-500/10' },
  pink: { text: 'text-pink-500', bg: 'bg-pink-500/10' },
  purple: { text: 'text-purple-500', bg: 'bg-purple-500/10' },
  cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  slate: { text: 'text-slate-500', bg: 'bg-slate-500/10' },
  yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  amber: { text: 'text-amber-500', bg: 'bg-amber-500/10' },
};

interface DraggableNodeProps {
  template: NodeTemplate;
}

function DraggableNode({ template }: DraggableNodeProps) {
  const Icon = iconMap[template.icon] || Zap;
  const colors = colorClasses[template.color] || colorClasses.slate;

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow/type', template.type);
    event.dataTransfer.setData(
      'application/reactflow/data',
      JSON.stringify(template.defaultData)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "group flex items-center gap-2.5 p-2.5 rounded-lg border-2 border-dashed border-border",
        "cursor-grab active:cursor-grabbing",
        "hover:border-primary/50 hover:bg-muted/50 transition-all duration-200",
        "select-none"
      )}
    >
      {/* Icon */}
      <div className={cn("p-1.5 rounded-md", colors.bg)}>
        <Icon className={cn("w-4 h-4", colors.text)} />
      </div>
      
      {/* Label */}
      <p className="text-sm font-medium">{template.label}</p>
    </div>
  );
}

interface WorkflowSidebarProps {
  className?: string;
}

export function WorkflowSidebar({ className }: WorkflowSidebarProps) {
  return (
    <div className={cn("w-56 border-r bg-card flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-yellow-500/10">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Workflow Nodes</h3>
            <p className="text-[10px] text-muted-foreground">
              Drag nodes onto the canvas
            </p>
          </div>
        </div>
      </div>

      {/* Node categories */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Triggers */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Triggers
            </h4>
            <div className="space-y-2">
              {triggerTemplates.map((template) => (
                <DraggableNode key={template.subType} template={template} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Actions
            </h4>
            <div className="space-y-2">
              {actionTemplates.map((template) => (
                <DraggableNode key={template.subType} template={template} />
              ))}
            </div>
          </div>

          {/* Logic */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Logic
            </h4>
            <div className="space-y-2">
              {logicTemplates.map((template) => (
                <DraggableNode key={template.subType} template={template} />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Tip: Connect nodes by dragging from one handle to another
        </p>
      </div>
    </div>
  );
}

