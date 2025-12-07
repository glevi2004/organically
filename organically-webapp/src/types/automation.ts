// Trigger types based on Instagram events
export type TriggerType = "comment_keyword" | "dm_keyword";

// Action types
export type ActionType = "send_dm" | "send_ai_response";

// Keyword match types
export type MatchType = "exact" | "contains" | "starts_with";

// Automation trigger configuration
export interface AutomationTrigger {
  type: TriggerType;
  keywords: string[];
  matchType: MatchType;
  caseSensitive: boolean;
  // For comment triggers - specific post IDs (empty = all posts)
  postIds?: string[];
}

// Automation action configuration
export interface AutomationAction {
  type: ActionType;
  // For predefined messages
  messageTemplate?: string;
  // For AI responses
  aiPrompt?: string;
  // Delay before sending (in seconds)
  delaySeconds?: number;
}

// Main Automation interface
export interface Automation {
  id: string;
  organizationId: string;
  channelId: string;
  name: string;
  description?: string;

  // Configuration
  trigger: AutomationTrigger;
  action: AutomationAction;

  // Status
  isActive: boolean;

  // Stats
  triggerCount: number;
  lastTriggeredAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Form data for creating/editing automations
export interface AutomationFormData {
  name: string;
  description: string;
  channelId: string;
  trigger: {
    type: TriggerType;
    keywords: string[];
    matchType: MatchType;
    caseSensitive: boolean;
    postIds: string[];
  };
  action: {
    type: ActionType;
    messageTemplate: string;
    aiPrompt: string;
    delaySeconds: number;
  };
  isActive: boolean;
}

// Default form values
export const defaultAutomationFormData: AutomationFormData = {
  name: "",
  description: "",
  channelId: "",
  trigger: {
    type: "dm_keyword",
    keywords: [],
    matchType: "contains",
    caseSensitive: false,
    postIds: [],
  },
  action: {
    type: "send_dm",
    messageTemplate: "",
    aiPrompt:
      "You are a helpful assistant. Respond to the following message: {{message}}",
    delaySeconds: 0,
  },
  isActive: true,
};
