"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Plus, 
  Trash2,
  MessageCircle,
  AtSign,
  Send,
  Sparkles,
  GitBranch,
  Clock,
} from 'lucide-react';
import { 
  WorkflowNode, 
  WorkflowNodeData,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  DelayNodeData,
  isTriggerNode,
  isActionNode,
  isConditionNode,
  isDelayNode,
  TriggerType,
  ActionType,
  ConditionOperator,
  DelayUnit,
} from '@/types/workflow';
import { cn } from '@/lib/utils';

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onClose: () => void;
  onChange: (nodeId: string, data: WorkflowNodeData) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeConfigPanel({ 
  node, 
  onClose, 
  onChange,
  onDelete,
}: NodeConfigPanelProps) {
  const [localData, setLocalData] = useState<WorkflowNodeData>(node.data);
  const [keywordInput, setKeywordInput] = useState('');

  // Sync local data when node changes
  useEffect(() => {
    setLocalData(node.data);
  }, [node.id, node.data]);

  // Update parent on local data change
  const updateData = (updates: Partial<WorkflowNodeData>) => {
    const newData = { ...localData, ...updates } as WorkflowNodeData;
    setLocalData(newData);
    onChange(node.id, newData);
  };

  // Keyword management for triggers
  const addKeyword = () => {
    if (!isTriggerNode(localData)) return;
    const keyword = keywordInput.trim();
    if (keyword && !localData.keywords?.includes(keyword)) {
      updateData({ 
        keywords: [...(localData.keywords || []), keyword] 
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    if (!isTriggerNode(localData)) return;
    updateData({
      keywords: localData.keywords?.filter((k) => k !== keyword) || [],
    });
  };

  // Get header config based on node type
  const getHeaderConfig = () => {
    if (isTriggerNode(localData)) {
      return { icon: MessageCircle, label: 'Trigger', color: 'blue' };
    }
    if (isActionNode(localData)) {
      return { icon: Send, label: 'Action', color: 'purple' };
    }
    if (isConditionNode(localData)) {
      return { icon: GitBranch, label: 'Condition', color: 'yellow' };
    }
    if (isDelayNode(localData)) {
      return { icon: Clock, label: 'Delay', color: 'amber' };
    }
    return { icon: MessageCircle, label: 'Node', color: 'gray' };
  };

  const headerConfig = getHeaderConfig();
  const HeaderIcon = headerConfig.icon;

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-md",
            `bg-${headerConfig.color}-500/10`
          )}>
            <HeaderIcon className={cn("w-4 h-4", `text-${headerConfig.color}-500`)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Configure {headerConfig.label}</h3>
            <p className="text-[10px] text-muted-foreground">
              ID: {node.id.slice(0, 12)}...
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Label (common to all) */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={localData.label}
              onChange={(e) => updateData({ label: e.target.value })}
              placeholder="Enter label..."
            />
          </div>

          {/* Trigger-specific fields */}
          {isTriggerNode(localData) && (
            <>
              {/* Trigger Type */}
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={localData.type}
                  onValueChange={(value: TriggerType) => 
                    updateData({ type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dm_keyword">DM Keyword</SelectItem>
                    <SelectItem value="comment_keyword">Comment Keyword</SelectItem>
                    <SelectItem value="new_follower">New Follower</SelectItem>
                    <SelectItem value="story_mention">Story Mention</SelectItem>
                    <SelectItem value="story_reply">Story Reply</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Keywords (for keyword-based triggers) */}
              {(localData.type === 'dm_keyword' || localData.type === 'comment_keyword') && (
                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button size="icon" variant="outline" onClick={addKeyword}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {localData.keywords && localData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {localData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                          {keyword}
                          <button
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
              )}

              {/* Match Type */}
              {(localData.type === 'dm_keyword' || localData.type === 'comment_keyword') && (
                <div className="space-y-2">
                  <Label>Match Type</Label>
                  <Select
                    value={localData.matchType || 'contains'}
                    onValueChange={(value: 'exact' | 'contains' | 'starts_with') => 
                      updateData({ matchType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exact">Exact Match</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Case Sensitive */}
              {(localData.type === 'dm_keyword' || localData.type === 'comment_keyword') && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="caseSensitive" className="cursor-pointer">
                    Case Sensitive
                  </Label>
                  <Switch
                    id="caseSensitive"
                    checked={localData.caseSensitive || false}
                    onCheckedChange={(checked) => 
                      updateData({ caseSensitive: checked })
                    }
                  />
                </div>
              )}
            </>
          )}

          {/* Action-specific fields */}
          {isActionNode(localData) && (
            <>
              {/* Action Type */}
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={localData.type}
                  onValueChange={(value: ActionType) => 
                    updateData({ type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_dm">Send DM</SelectItem>
                    <SelectItem value="send_ai_response">AI Response</SelectItem>
                    <SelectItem value="reply_comment">Reply to Comment</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Template */}
              {(localData.type === 'send_dm' || localData.type === 'reply_comment') && (
                <div className="space-y-2">
                  <Label htmlFor="messageTemplate">Message Template</Label>
                  <Textarea
                    id="messageTemplate"
                    value={localData.messageTemplate || ''}
                    onChange={(e) => updateData({ messageTemplate: e.target.value })}
                    placeholder="Enter your message..."
                    rows={4}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Use {"{{username}}"} to include the sender&apos;s username
                  </p>
                </div>
              )}

              {/* AI Prompt */}
              {localData.type === 'send_ai_response' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="aiPrompt">AI Prompt</Label>
                    <Textarea
                      id="aiPrompt"
                      value={localData.aiPrompt || ''}
                      onChange={(e) => updateData({ aiPrompt: e.target.value })}
                      placeholder="Describe how the AI should respond..."
                      rows={4}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Use {"{{message}}"} to include the received message
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select
                      value={localData.aiModel || 'gpt-4o-mini'}
                      onValueChange={(value: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet') => 
                        updateData({ aiModel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Webhook URL */}
              {localData.type === 'webhook' && (
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={localData.webhookUrl || ''}
                    onChange={(e) => updateData({ webhookUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Delay */}
              <div className="space-y-2">
                <Label htmlFor="delaySeconds">Response Delay (seconds)</Label>
                <Input
                  id="delaySeconds"
                  type="number"
                  min="0"
                  max="3600"
                  value={localData.delaySeconds || 0}
                  onChange={(e) => 
                    updateData({ delaySeconds: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </>
          )}

          {/* Condition-specific fields */}
          {isConditionNode(localData) && (
            <>
              <div className="space-y-2">
                <Label>Field to Check</Label>
                <Select
                  value={localData.field || 'message'}
                  onValueChange={(value) => updateData({ field: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Message Content</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="follower_count">Follower Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={localData.operator || 'contains'}
                  onValueChange={(value: ConditionOperator) => 
                    updateData({ operator: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="not_contains">Not Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="is_empty">Is Empty</SelectItem>
                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!['is_empty', 'is_not_empty'].includes(localData.operator) && (
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={localData.value || ''}
                    onChange={(e) => updateData({ value: e.target.value })}
                    placeholder="Enter value..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="trueLabel">True Label</Label>
                  <Input
                    id="trueLabel"
                    value={localData.trueLabel || 'Yes'}
                    onChange={(e) => updateData({ trueLabel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="falseLabel">False Label</Label>
                  <Input
                    id="falseLabel"
                    value={localData.falseLabel || 'No'}
                    onChange={(e) => updateData({ falseLabel: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Delay-specific fields */}
          {isDelayNode(localData) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={localData.duration || 5}
                  onChange={(e) => 
                    updateData({ duration: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={localData.unit || 'seconds'}
                  onValueChange={(value: DelayUnit) => 
                    updateData({ unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with delete button */}
      <div className="p-4 border-t">
        <Button 
          variant="destructive" 
          className="w-full gap-2"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}

