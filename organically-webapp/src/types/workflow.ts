import { Node, Edge } from '@xyflow/react';

// ============================================
// Node Types
// ============================================

export type WorkflowNodeType = 
  | 'trigger' 
  | 'action' 
  | 'delay';

// ============================================
// Trigger Types & Data
// ============================================

export type TriggerType = 
  | 'direct_message' 
  | 'post_comment';

export interface TriggerNodeData {
  nodeType: 'trigger';
  type: TriggerType;
  label: string;
  keywords?: string[];
  matchType?: 'exact' | 'contains' | 'starts_with';
  caseSensitive?: boolean;
}

// ============================================
// Action Types & Data
// ============================================

export type ActionType = 
  | 'send_message' 
  | 'reply_comment';

export interface ActionNodeData {
  nodeType: 'action';
  type: ActionType;
  label: string;
  messageTemplate?: string;
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
  type: 'direct_message',
  label: 'Direct Message',
  keywords: [],
  matchType: 'contains',
  caseSensitive: false,
};

export const defaultActionData: ActionNodeData = {
  nodeType: 'action',
  type: 'send_message',
  label: 'Send Message',
  messageTemplate: '',
};

export const defaultDelayData: DelayNodeData = {
  nodeType: 'delay',
  label: 'Delay',
  duration: 5,
  unit: 'minutes',
};

// ============================================
// Node Templates for Sidebar
// ============================================

export interface NodeTemplate {
  type: WorkflowNodeType;
  subType: TriggerType | ActionType | 'delay';
  label: string;
  icon: string; // Icon name from lucide-react
  color: string; // Tailwind color name
  defaultData: WorkflowNodeData;
  // Which triggers this action is compatible with (only for actions)
  compatibleTriggers?: TriggerType[];
}

export const triggerTemplates: NodeTemplate[] = [
  {
    type: 'trigger',
    subType: 'direct_message',
    label: 'Direct Message',
    icon: 'MessageCircle',
    color: 'blue',
    defaultData: {
      nodeType: 'trigger',
      type: 'direct_message',
      label: 'Direct Message',
      keywords: [],
      matchType: 'contains',
      caseSensitive: false,
    },
  },
  {
    type: 'trigger',
    subType: 'post_comment',
    label: 'Post Comment',
    icon: 'MessageSquare',
    color: 'orange',
    defaultData: {
      nodeType: 'trigger',
      type: 'post_comment',
      label: 'Post Comment',
      keywords: [],
      matchType: 'contains',
      caseSensitive: false,
    },
  },
];

export const actionTemplates: NodeTemplate[] = [
  {
    type: 'action',
    subType: 'reply_comment',
    label: 'Reply to Comment',
    icon: 'Reply',
    color: 'cyan',
    defaultData: {
      nodeType: 'action',
      type: 'reply_comment',
      label: 'Reply to Comment',
      messageTemplate: '',
    },
    // Only available when Post Comment trigger is used
    compatibleTriggers: ['post_comment'],
  },
  {
    type: 'action',
    subType: 'send_message',
    label: 'Send Message',
    icon: 'Send',
    color: 'purple',
    defaultData: {
      nodeType: 'action',
      type: 'send_message',
      label: 'Send Message',
      messageTemplate: '',
    },
    // Available for all triggers
    compatibleTriggers: ['direct_message', 'post_comment'],
  },
];

export const delayTemplates: NodeTemplate[] = [
  {
    type: 'delay',
    subType: 'delay',
    label: 'Delay',
    icon: 'Clock',
    color: 'amber',
    defaultData: defaultDelayData,
  },
];

export const allNodeTemplates = [
  ...triggerTemplates,
  ...actionTemplates,
  ...delayTemplates,
];

// ============================================
// Action Compatibility Helper
// ============================================

/**
 * Returns filtered action templates based on the trigger type in the workflow
 */
export function getCompatibleActions(triggerType: TriggerType | null): NodeTemplate[] {
  if (!triggerType) {
    // No trigger selected, show all actions
    return actionTemplates;
  }
  
  return actionTemplates.filter(
    (action) => action.compatibleTriggers?.includes(triggerType)
  );
}

// ============================================
// Validation Helpers
// ============================================

export function isTriggerNode(data: WorkflowNodeData): data is TriggerNodeData {
  return data.nodeType === 'trigger';
}

export function isActionNode(data: WorkflowNodeData): data is ActionNodeData {
  return data.nodeType === 'action';
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

  // Validate action compatibility with trigger
  if (triggers.length > 0) {
    const triggerData = triggers[0].data as TriggerNodeData;
    
    actions.forEach((action) => {
      const actionData = action.data as ActionNodeData;
      const template = actionTemplates.find((t) => t.subType === actionData.type);
      
      if (template && !template.compatibleTriggers?.includes(triggerData.type)) {
        errors.push({
          nodeId: action.id,
          message: `"${actionData.label}" is not compatible with "${triggerData.label}" trigger`,
        });
      }
    });
  }

  return errors;
}
