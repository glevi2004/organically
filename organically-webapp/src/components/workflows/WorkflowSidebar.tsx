"use client";

import { DragEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  MessageSquare,
  Send, 
  Reply,
  GitBranch,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  triggerTemplates, 
  actionTemplates, 
  conditionTemplates,
  delayTemplates,
  getCompatibleActions,
  NodeTemplate,
  TriggerType,
} from '@/types/workflow';

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  MessageCircle,
  MessageSquare,
  Send,
  Reply,
  GitBranch,
  Clock,
  Zap,
};

// Color classes for each color name
const colorClasses: Record<string, { text: string; bg: string }> = {
  blue: { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  orange: { text: 'text-orange-500', bg: 'bg-orange-500/10' },
  purple: { text: 'text-purple-500', bg: 'bg-purple-500/10' },
  cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  amber: { text: 'text-amber-500', bg: 'bg-amber-500/10' },
};

interface DraggableNodeProps {
  template: NodeTemplate;
  disabled?: boolean;
  disabledReason?: string;
}

function DraggableNode({ template, disabled, disabledReason }: DraggableNodeProps) {
  const Icon = iconMap[template.icon] || Zap;
  const colors = colorClasses[template.color] || colorClasses.amber;

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow/type', template.type);
    event.dataTransfer.setData(
      'application/reactflow/data',
      JSON.stringify(template.defaultData)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = () => {
    if (disabled && disabledReason) {
      toast.error(disabledReason);
    }
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-2.5 p-2.5 rounded-lg border-2 border-dashed border-border",
        "select-none transition-all duration-200",
        disabled 
          ? "opacity-40 cursor-not-allowed" 
          : "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-muted/50"
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
  currentTriggerType?: TriggerType | null;
  hasTrigger?: boolean;
}

export function WorkflowSidebar({ className, currentTriggerType, hasTrigger = false }: WorkflowSidebarProps) {
  // Get compatible actions based on current trigger
  const compatibleActions = getCompatibleActions(currentTriggerType || null);
  const compatibleActionSubTypes = new Set(compatibleActions.map(a => a.subType));

  // Determine if actions/delay should be disabled
  const noTriggerReason = "Add a trigger first before adding actions or delays";

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
              {actionTemplates.map((template) => {
                const isIncompatible = hasTrigger && !compatibleActionSubTypes.has(template.subType);
                const isDisabled = !hasTrigger || isIncompatible;
                const reason = !hasTrigger 
                  ? noTriggerReason 
                  : isIncompatible 
                    ? `"${template.label}" is not compatible with this trigger`
                    : undefined;

                return (
                  <DraggableNode 
                    key={template.subType} 
                    template={template} 
                    disabled={isDisabled}
                    disabledReason={reason}
                  />
                );
              })}
            </div>
          </div>

          {/* Logic */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Logic
            </h4>
            <div className="space-y-2">
              {conditionTemplates.map((template) => (
                <DraggableNode 
                  key={template.subType} 
                  template={template}
                  disabled={!hasTrigger}
                  disabledReason={!hasTrigger ? noTriggerReason : undefined}
                />
              ))}
              {delayTemplates.map((template) => (
                <DraggableNode 
                  key={template.subType} 
                  template={template}
                  disabled={!hasTrigger}
                  disabledReason={!hasTrigger ? noTriggerReason : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          {!hasTrigger 
            ? "👆 Start by adding a trigger"
            : "💡 Connect nodes by dragging handles"
          }
        </p>
      </div>
    </div>
  );
}

