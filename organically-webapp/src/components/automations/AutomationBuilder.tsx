"use client";

import { useState, useEffect } from "react";
import {
  AutomationFormData,
  defaultAutomationFormData,
} from "@/types/automation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  AtSign,
  Plus,
  X,
  Sparkles,
  Check,
  ChevronDown,
  Send,
  PlusCircle,
  Link2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationBuilderProps {
  initialData?: AutomationFormData;
  onChange: (data: AutomationFormData) => void;
  onActivate: () => void;
  isActive: boolean;
  isSaving?: boolean;
}

export function AutomationBuilder({
  initialData,
  onChange,
  onActivate,
  isActive,
  isSaving = false,
}: AutomationBuilderProps) {
  const [formData, setFormData] = useState<AutomationFormData>(
    initialData || defaultAutomationFormData
  );
  const [keywordInput, setKeywordInput] = useState("");
  const [showTriggerOptions, setShowTriggerOptions] = useState(false);
  const [triggerSelected, setTriggerSelected] = useState(false);

  // If editing existing automation, mark trigger as selected
  useEffect(() => {
    if (initialData && initialData.trigger.keywords.length > 0) {
      setTriggerSelected(true);
    }
  }, [initialData]);

  const updateTrigger = (updates: Partial<AutomationFormData["trigger"]>) => {
    const newData = {
      ...formData,
      trigger: { ...formData.trigger, ...updates },
    };
    setFormData(newData);
    onChange(newData);
  };

  const updateAction = (updates: Partial<AutomationFormData["action"]>) => {
    const newData = {
      ...formData,
      action: { ...formData.action, ...updates },
    };
    setFormData(newData);
    onChange(newData);
  };

  const selectTriggerType = (type: "dm_keyword" | "comment_keyword") => {
    updateTrigger({ type });
    setTriggerSelected(true);
    setShowTriggerOptions(false);
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

  const getTriggerTitle = () => {
    switch (formData.trigger.type) {
      case "dm_keyword":
        return "User sends me a direct message";
      case "comment_keyword":
        return "User comments on my post";
      default:
        return "Select a trigger";
    }
  };

  const getTriggerDescription = () => {
    switch (formData.trigger.type) {
      case "dm_keyword":
        return "If the user sends you a message that contains a keyword, this automation will fire";
      case "comment_keyword":
        return "If a user comments with a keyword on your post, this automation will fire";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center py-8">
      {/* Flow Container */}
      <div className="w-full max-w-xl space-y-0">
        {/* WHEN Block - Trigger */}
        <div className="relative">
          <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold">!</span>
              </div>
              <span className="font-semibold">When...</span>
            </div>

            {/* Initial State - Add Trigger Button */}
            {!triggerSelected && !showTriggerOptions && (
              <button
                onClick={() => setShowTriggerOptions(true)}
                className="w-full p-4 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-primary"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium">Add Trigger</span>
              </button>
            )}

            {/* Trigger Type Selection */}
            {!triggerSelected && showTriggerOptions && (
              <div className="space-y-2">
                <button
                  onClick={() => selectTriggerType("dm_keyword")}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="font-medium">
                      User sends me a direct message
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Trigger when someone DMs you with specific keywords
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => selectTriggerType("comment_keyword")}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <AtSign className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <span className="font-medium">
                      User comments on my post
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Trigger when someone comments with specific keywords
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Trigger Selected - Show Full Configuration */}
            {triggerSelected && (
              <>
                {/* Trigger Selection */}
                <button
                  onClick={() => setShowTriggerOptions(!showTriggerOptions)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg mt-0.5",
                        formData.trigger.type === "dm_keyword"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-orange-500/10 text-orange-500"
                      )}
                    >
                      {formData.trigger.type === "dm_keyword" ? (
                        <MessageCircle className="w-5 h-5" />
                      ) : (
                        <AtSign className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {getTriggerTitle()}
                        </h3>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            showTriggerOptions && "rotate-180"
                          )}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTriggerDescription()}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Trigger Type Selection Dropdown */}
                {showTriggerOptions && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                    <button
                      onClick={() => {
                        updateTrigger({ type: "dm_keyword" });
                        setShowTriggerOptions(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        formData.trigger.type === "dm_keyword"
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>User sends me a direct message</span>
                    </button>
                    <button
                      onClick={() => {
                        updateTrigger({ type: "comment_keyword" });
                        setShowTriggerOptions(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        formData.trigger.type === "comment_keyword"
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <AtSign className="w-5 h-5" />
                      <span>User comments on my post</span>
                    </button>
                  </div>
                )}

                {/* Keywords */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.trigger.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        className="bg-primary text-primary-foreground gap-1 pr-1 text-sm py-1 px-3"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:bg-primary-foreground/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Add keyword..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        className="h-8 w-32 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={addKeyword}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Connector Line - only show when trigger has keywords */}
          {formData.trigger.keywords.length > 0 && (
            <div className="flex flex-col items-center py-2">
              <div className="w-0.5 h-8 bg-border" />
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                Then
              </div>
              <div className="w-0.5 h-8 bg-border" />
            </div>
          )}
        </div>

        {/* THEN Block - Action - only show when trigger has keywords */}
        {formData.trigger.keywords.length > 0 && (
          <div className="relative">
            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
              {/* Action Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mt-0.5">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Send the user a message
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the message that you want to send the user.
                  </p>
                </div>
              </div>

              {/* Smart AI Toggle */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2 transition-colors mb-4",
                  formData.action.type === "send_ai_response"
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/30 border-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={cn(
                        "w-5 h-5",
                        formData.action.type === "send_ai_response"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <Label
                      htmlFor="smartAi"
                      className="font-medium cursor-pointer"
                    >
                      Let Smart AI take over
                    </Label>
                  </div>
                  <Switch
                    id="smartAi"
                    checked={formData.action.type === "send_ai_response"}
                    onCheckedChange={(checked) =>
                      updateAction({
                        type: checked ? "send_ai_response" : "send_dm",
                      })
                    }
                  />
                </div>

                {formData.action.type === "send_ai_response" && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Tell AI about your project.
                    </p>
                    <Textarea
                      placeholder="Describe what you want the AI to know about your business, and how it should respond to users..."
                      value={formData.action.aiPrompt}
                      onChange={(e) =>
                        updateAction({ aiPrompt: e.target.value })
                      }
                      rows={4}
                      className="resize-none bg-background"
                    />
                  </div>
                )}
              </div>

              {/* Manual Message (when not using AI) */}
              {formData.action.type === "send_dm" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your message here..."
                    value={formData.action.messageTemplate}
                    onChange={(e) =>
                      updateAction({ messageTemplate: e.target.value })
                    }
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{username}}"} to include the sender&apos;s username
                  </p>
                </div>
              )}

              {/* Add reply for comments option (when trigger is comment) */}
              {formData.trigger.type === "comment_keyword" && (
                <div className="mt-4 pt-4 border-t">
                  <Input
                    placeholder="Add a reply for comments (Optional)"
                    className="bg-muted/50"
                  />
                </div>
              )}

              {/* Link Post Button - only for comment triggers */}
              {formData.trigger.type === "comment_keyword" && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-dashed"
                  onClick={() => {
                    // TODO: Open post selection modal
                  }}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Post
                </Button>
              )}

              {/* Finalize Button */}
              <Button className="w-full mt-4 gap-2" onClick={onActivate}>
                <Zap className="w-4 h-4" />
                Activate Automation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
