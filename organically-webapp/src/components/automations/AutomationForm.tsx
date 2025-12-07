"use client";

import { useState } from "react";
import {
  AutomationFormData,
  defaultAutomationFormData,
  TriggerType,
  ActionType,
  MatchType,
} from "@/types/automation";
import { Channel } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  AtSign,
  Sparkles,
  Send,
  Plus,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AutomationFormData;
  channels: Channel[];
  onSubmit: (data: AutomationFormData) => void;
  isEditing?: boolean;
}

export function AutomationForm({
  open,
  onOpenChange,
  initialData,
  channels,
  onSubmit,
  isEditing = false,
}: AutomationFormProps) {
  const [formData, setFormData] = useState<AutomationFormData>(
    initialData || defaultAutomationFormData
  );
  const [keywordInput, setKeywordInput] = useState("");

  const updateTrigger = (updates: Partial<AutomationFormData["trigger"]>) => {
    setFormData((prev) => ({
      ...prev,
      trigger: { ...prev.trigger, ...updates },
    }));
  };

  const updateAction = (updates: Partial<AutomationFormData["action"]>) => {
    setFormData((prev) => ({
      ...prev,
      action: { ...prev.action, ...updates },
    }));
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.trigger.keywords.includes(keyword)) {
      updateTrigger({ keywords: [...formData.trigger.keywords, keyword] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    updateTrigger({
      keywords: formData.trigger.keywords.filter((k) => k !== keyword),
    });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!isEditing) {
      setFormData(defaultAutomationFormData);
    }
    onOpenChange(false);
  };

  const triggerOptions: {
    value: TriggerType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: "dm_keyword",
      label: "DM Keyword",
      icon: <MessageCircle className="w-5 h-5" />,
      description:
        "Trigger when someone sends a DM containing specific keywords",
    },
    {
      value: "comment_keyword",
      label: "Comment Keyword",
      icon: <AtSign className="w-5 h-5" />,
      description: "Trigger when someone comments with specific keywords",
    },
  ];

  const actionOptions: {
    value: ActionType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: "send_dm",
      label: "Send Message",
      icon: <Send className="w-5 h-5" />,
      description: "Send a predefined message as a reply",
    },
    {
      value: "send_ai_response",
      label: "AI Response",
      icon: <Sparkles className="w-5 h-5" />,
      description: "Generate a personalized response using AI",
    },
  ];

  const matchTypeOptions: { value: MatchType; label: string }[] = [
    { value: "contains", label: "Contains" },
    { value: "exact", label: "Exact Match" },
    { value: "starts_with", label: "Starts With" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {isEditing ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
          <DialogDescription>
            Set up automated responses for your Instagram messages and comments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Automation Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Welcome Message"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Instagram Channel</Label>
                <Select
                  value={formData.channelId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, channelId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No channels connected
                      </SelectItem>
                    ) : (
                      channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          @{channel.accountName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this automation do?"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          {/* Trigger Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trigger</CardTitle>
              <CardDescription>
                When should this automation run?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trigger Type Selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                {triggerOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateTrigger({ type: option.value })}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                      formData.trigger.type === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md",
                        formData.trigger.type === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Keywords to Match</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a keyword and press Enter"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.trigger.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.trigger.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Options */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Match Type</Label>
                  <Select
                    value={formData.trigger.matchType}
                    onValueChange={(value: MatchType) =>
                      updateTrigger({ matchType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {matchTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="caseSensitive" className="cursor-pointer">
                    Case Sensitive
                  </Label>
                  <Switch
                    id="caseSensitive"
                    checked={formData.trigger.caseSensitive}
                    onCheckedChange={(checked) =>
                      updateTrigger({ caseSensitive: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Action</CardTitle>
              <CardDescription>
                What should happen when triggered?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Type Selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                {actionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateAction({ type: option.value })}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                      formData.action.type === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md",
                        formData.action.type === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Message Template (for send_dm) */}
              {formData.action.type === "send_dm" && (
                <div className="space-y-2">
                  <Label htmlFor="messageTemplate">Message Template</Label>
                  <Textarea
                    id="messageTemplate"
                    placeholder="Hi! Thanks for reaching out. How can I help you today?"
                    value={formData.action.messageTemplate}
                    onChange={(e) =>
                      updateAction({ messageTemplate: e.target.value })
                    }
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{username}}"} to include the sender's username
                  </p>
                </div>
              )}

              {/* AI Prompt (for send_ai_response) */}
              {formData.action.type === "send_ai_response" && (
                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">AI Prompt</Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="You are a helpful assistant for my Instagram account..."
                    value={formData.action.aiPrompt}
                    onChange={(e) => updateAction({ aiPrompt: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{message}}"} to include the received message in the
                    prompt
                  </p>
                </div>
              )}

              {/* Delay */}
              <div className="space-y-2">
                <Label htmlFor="delay">Response Delay (seconds)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  max="3600"
                  placeholder="0"
                  value={formData.action.delaySeconds || ""}
                  onChange={(e) =>
                    updateAction({
                      delaySeconds: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Wait before sending the response (0 = immediate)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base cursor-pointer">
                Enable Automation
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn this automation on or off
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
