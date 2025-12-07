"use client";

import { Automation } from "@/types/automation";
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
  AtSign,
  Sparkles,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  automation: Automation;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (id: string) => void;
}

export function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDelete,
}: AutomationCardProps) {
  const getTriggerIcon = () => {
    switch (automation.trigger.type) {
      case "dm_keyword":
        return <MessageCircle className="w-4 h-4" />;
      case "comment_keyword":
        return <AtSign className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTriggerLabel = () => {
    switch (automation.trigger.type) {
      case "dm_keyword":
        return "DM Keyword";
      case "comment_keyword":
        return "Comment Keyword";
      default:
        return "Unknown";
    }
  };

  const getActionIcon = () => {
    switch (automation.action.type) {
      case "send_ai_response":
        return <Sparkles className="w-4 h-4" />;
      case "send_dm":
        return <Send className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getActionLabel = () => {
    switch (automation.action.type) {
      case "send_ai_response":
        return "AI Response";
      case "send_dm":
        return "Send Message";
      default:
        return "Unknown";
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

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        !automation.isActive && "opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">
                {automation.name}
              </CardTitle>
              {automation.isActive ? (
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
            {automation.description && (
              <CardDescription className="line-clamp-2">
                {automation.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={automation.isActive}
              onCheckedChange={(checked) => onToggle(automation.id, checked)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(automation)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(automation.id)}
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
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Keywords:</p>
          <div className="flex flex-wrap gap-1.5">
            {automation.trigger.keywords.slice(0, 5).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {automation.trigger.keywords.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{automation.trigger.keywords.length - 5} more
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{automation.triggerCount} triggers</span>
            </div>
            {automation.action.delaySeconds &&
              automation.action.delaySeconds > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{automation.action.delaySeconds}s delay</span>
                </div>
              )}
          </div>
          <div>Last: {formatDate(automation.lastTriggeredAt)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
