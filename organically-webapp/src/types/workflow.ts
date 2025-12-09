import { Node, Edge } from '@xyflow/react';

// ============================================
// Node Types
// ============================================

export type WorkflowNodeType = 
  | 'trigger' 
  | 'action' 
  | 'condition' 
  | 'delay';

// ============================================
// Trigger Types & Data
// ============================================

export type TriggerType = 
  | 'dm_keyword' 
  | 'comment_keyword' 
  | 'new_follower' 
  | 'story_mention'
  | 'story_reply'
  | 'scheduled';

export interface TriggerNodeData {
  nodeType: 'trigger';
  type: TriggerType;
  label: string;
  keywords?: string[];
  matchType?: 'exact' | 'contains' | 'starts_with';
  caseSensitive?: boolean;
  postIds?: string[]; // For comment triggers - specific posts
}

// ============================================
// Action Types & Data
// ============================================

export type ActionType = 
  | 'send_dm' 
  | 'send_ai_response' 
  | 'reply_comment'
  | 'add_to_list'
  | 'webhook'
  | 'send_email';

export interface ActionNodeData {
  nodeType: 'action';
  type: ActionType;
  label: string;
  messageTemplate?: string;
  aiPrompt?: string;
  aiModel?: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet';
  webhookUrl?: string;
  delaySeconds?: number;
}

// ============================================
// Condition Types & Data
// ============================================

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionNodeData {
  nodeType: 'condition';
  label: string;
  field: string; // e.g., 'message', 'username', 'follower_count'
  operator: ConditionOperator;
  value: string;
  trueLabel?: string;
  falseLabel?: string;
}

// ============================================
// Delay Types & Data
// ============================================

export type DelayUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export interface DelayNodeData {
  nodeType: 'delay';
  label: string;
  duration: number;
  unit: DelayUnit;
}

// ============================================
// Union Types
// ============================================

export type WorkflowNodeData = 
  | TriggerNodeData 
  | ActionNodeData 
  | ConditionNodeData 
  | DelayNodeData;

// ============================================
// React Flow Types
// ============================================

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;
export type WorkflowEdge = Edge<{ label?: string }>;

// ============================================
// Workflow Document (Firestore)
// ============================================

export interface Workflow {
  id: string;
  organizationId: string;
  channelId: string;
  name: string;
  description?: string;
  
  // React Flow data
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  
  // Status
  isActive: boolean;
  
  // Stats
  triggerCount: number;
  lastTriggeredAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================
// Form & Default Data
// ============================================

export const defaultTriggerData: TriggerNodeData = {
  nodeType: 'trigger',
  type: 'dm_keyword',
  label: 'When someone DMs',
  keywords: [],
  matchType: 'contains',
  caseSensitive: false,
};

export const defaultActionData: ActionNodeData = {
  nodeType: 'action',
  type: 'send_dm',
  label: 'Send a message',
  messageTemplate: '',
  delaySeconds: 0,
};

export const defaultConditionData: ConditionNodeData = {
  nodeType: 'condition',
  label: 'If / Else',
  field: 'message',
  operator: 'contains',
  value: '',
  trueLabel: 'Yes',
  falseLabel: 'No',
};

export const defaultDelayData: DelayNodeData = {
  nodeType: 'delay',
  label: 'Wait',
  duration: 5,
  unit: 'seconds',
};

// ============================================
// Node Templates for Sidebar
// ============================================

export interface NodeTemplate {
  type: WorkflowNodeType;
  subType: TriggerType | ActionType | 'condition' | 'delay';
  label: string;
  description: string;
  icon: string; // Icon name from lucide-react
  color: string; // Tailwind color name
  defaultData: WorkflowNodeData;
}

export const triggerTemplates: NodeTemplate[] = [
  {
    type: 'trigger',
    subType: 'dm_keyword',
    label: 'DM Keyword',
    description: 'When someone sends a DM with specific keywords',
    icon: 'MessageCircle',
    color: 'blue',
    defaultData: {
      nodeType: 'trigger',
      type: 'dm_keyword',
      label: 'When someone DMs',
      keywords: [],
      matchType: 'contains',
      caseSensitive: false,
    },
  },
  {
    type: 'trigger',
    subType: 'comment_keyword',
    label: 'Comment Keyword',
    description: 'When someone comments with specific keywords',
    icon: 'AtSign',
    color: 'orange',
    defaultData: {
      nodeType: 'trigger',
      type: 'comment_keyword',
      label: 'When someone comments',
      keywords: [],
      matchType: 'contains',
      caseSensitive: false,
    },
  },
  {
    type: 'trigger',
    subType: 'new_follower',
    label: 'New Follower',
    description: 'When someone follows your account',
    icon: 'UserPlus',
    color: 'green',
    defaultData: {
      nodeType: 'trigger',
      type: 'new_follower',
      label: 'When someone follows',
    },
  },
  {
    type: 'trigger',
    subType: 'story_mention',
    label: 'Story Mention',
    description: 'When someone mentions you in their story',
    icon: 'Star',
    color: 'pink',
    defaultData: {
      nodeType: 'trigger',
      type: 'story_mention',
      label: 'When mentioned in story',
    },
  },
];

export const actionTemplates: NodeTemplate[] = [
  {
    type: 'action',
    subType: 'send_dm',
    label: 'Send Message',
    description: 'Send a direct message to the user',
    icon: 'Send',
    color: 'purple',
    defaultData: {
      nodeType: 'action',
      type: 'send_dm',
      label: 'Send a message',
      messageTemplate: '',
    },
  },
  {
    type: 'action',
    subType: 'send_ai_response',
    label: 'AI Response',
    description: 'Generate a personalized AI response',
    icon: 'Sparkles',
    color: 'pink',
    defaultData: {
      nodeType: 'action',
      type: 'send_ai_response',
      label: 'AI Response',
      aiPrompt: 'You are a helpful assistant. Respond naturally to: {{message}}',
      aiModel: 'gpt-4o-mini',
    },
  },
  {
    type: 'action',
    subType: 'reply_comment',
    label: 'Reply to Comment',
    description: 'Post a reply to the triggering comment',
    icon: 'Reply',
    color: 'cyan',
    defaultData: {
      nodeType: 'action',
      type: 'reply_comment',
      label: 'Reply to comment',
      messageTemplate: '',
    },
  },
  {
    type: 'action',
    subType: 'webhook',
    label: 'Webhook',
    description: 'Send data to an external URL',
    icon: 'Webhook',
    color: 'slate',
    defaultData: {
      nodeType: 'action',
      type: 'webhook',
      label: 'Send webhook',
      webhookUrl: '',
    },
  },
];

export const logicTemplates: NodeTemplate[] = [
  {
    type: 'condition',
    subType: 'condition',
    label: 'Condition',
    description: 'Branch the workflow based on a condition',
    icon: 'GitBranch',
    color: 'yellow',
    defaultData: defaultConditionData,
  },
  {
    type: 'delay',
    subType: 'delay',
    label: 'Delay',
    description: 'Wait before continuing the workflow',
    icon: 'Clock',
    color: 'amber',
    defaultData: defaultDelayData,
  },
];

export const allNodeTemplates = [
  ...triggerTemplates,
  ...actionTemplates,
  ...logicTemplates,
];

// ============================================
// Validation Helpers
// ============================================

export function isTriggerNode(data: WorkflowNodeData): data is TriggerNodeData {
  return data.nodeType === 'trigger';
}

export function isActionNode(data: WorkflowNodeData): data is ActionNodeData {
  return data.nodeType === 'action';
}

export function isConditionNode(data: WorkflowNodeData): data is ConditionNodeData {
  return data.nodeType === 'condition';
}

export function isDelayNode(data: WorkflowNodeData): data is DelayNodeData {
  return data.nodeType === 'delay';
}

// ============================================
// Workflow Validation
// ============================================

export interface WorkflowValidationError {
  nodeId?: string;
  field?: string;
  message: string;
}

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  // Must have at least one trigger
  const triggers = nodes.filter((n) => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push({ message: 'Workflow must have at least one trigger' });
  }

  // Must have at least one action
  const actions = nodes.filter((n) => n.type === 'action');
  if (actions.length === 0) {
    errors.push({ message: 'Workflow must have at least one action' });
  }

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (node.type !== 'trigger' && !connectedNodeIds.has(node.id)) {
      errors.push({
        nodeId: node.id,
        message: `Node "${node.data.label}" is not connected`,
      });
    }
  });

  // Validate trigger keywords
  triggers.forEach((trigger) => {
    const data = trigger.data as TriggerNodeData;
    if (
      (data.type === 'dm_keyword' || data.type === 'comment_keyword') &&
      (!data.keywords || data.keywords.length === 0)
    ) {
      errors.push({
        nodeId: trigger.id,
        field: 'keywords',
        message: 'Trigger must have at least one keyword',
      });
    }
  });

  // Validate action message templates
  actions.forEach((action) => {
    const data = action.data as ActionNodeData;
    if (data.type === 'send_dm' && !data.messageTemplate?.trim()) {
      errors.push({
        nodeId: action.id,
        field: 'messageTemplate',
        message: 'Action must have a message template',
      });
    }
    if (data.type === 'send_ai_response' && !data.aiPrompt?.trim()) {
      errors.push({
        nodeId: action.id,
        field: 'aiPrompt',
        message: 'AI action must have a prompt',
      });
    }
  });

  return errors;
}

