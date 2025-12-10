"use client";

import {
  Workflow,
  TriggerNodeData,
  ActionNodeData,
  isTriggerNode,
  isActionNode,
} from "@/types/workflow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  MessageSquare,
  Reply,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowCardProps {
  workflow: Workflow;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  onToggle,
  onEdit,
  onDelete,
}: WorkflowCardProps) {
  // Extract trigger and action from nodes
  const triggerNode = workflow.nodes.find(
    (n) => n.type === "trigger" && isTriggerNode(n.data)
  );
  const actionNode = workflow.nodes.find(
    (n) => n.type === "action" && isActionNode(n.data)
  );

  const trigger = triggerNode?.data as TriggerNodeData | undefined;
  const action = actionNode?.data as ActionNodeData | undefined;

  const getTriggerIcon = () => {
    switch (trigger?.type) {
      case "direct_message":
        return <MessageCircle className="w-4 h-4" />;
      case "post_comment":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTriggerLabel = () => {
    switch (trigger?.type) {
      case "direct_message":
        return "DM Received";
      case "post_comment":
        return "Comment Received";
      default:
        return "Unknown Trigger";
    }
  };

  const getActionIcon = () => {
    switch (action?.type) {
      case "reply_comment":
        return <Reply className="w-4 h-4" />;
      case "send_message":
        return <Send className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getActionLabel = () => {
    switch (action?.type) {
      case "reply_comment":
        return "Reply to Comment";
      case "send_message":
        return "Send Message";
      default:
        return "Unknown Action";
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const keywords = trigger?.keywords || [];

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer hover:border-primary/50",
        !workflow.isActive && "opacity-60"
      )}
      onClick={() => onEdit(workflow)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">
                {workflow.name}
              </CardTitle>
              {workflow.isActive ? (
                <Badge
                  variant="default"
                  className="bg-green-500/10 text-green-600 border-green-500/20"
                >
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Paused</Badge>
              )}
            </div>
            {workflow.description && (
              <CardDescription className="line-clamp-2">
                {workflow.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={workflow.isActive}
              onCheckedChange={(checked) => {
                // Prevent card click from firing
                onToggle(workflow.id, checked);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(workflow);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(workflow.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trigger & Action Row */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
            {getTriggerIcon()}
            <span className="font-medium">{getTriggerLabel()}</span>
          </div>
          <div className="text-muted-foreground">→</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
            {getActionIcon()}
            <span className="font-medium">{getActionLabel()}</span>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              Keywords:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {keywords.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{keywords.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{workflow.triggerCount} triggers</span>
            </div>
          </div>
          <div>Last: {formatDate(workflow.lastTriggeredAt)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
