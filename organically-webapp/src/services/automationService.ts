import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  TriggerNodeData,
  isTriggerNode,
} from "@/types/workflow";

// ============================================================================
// AUTOMATION/WORKFLOW CRUD OPERATIONS
// Path: organizations/{orgId}/automations/{automationId}
// ============================================================================

/**
 * Generate a unique automation ID
 */
function generateAutomationId(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert Firestore document to Workflow object
 */
function docToWorkflow(docData: Record<string, unknown>, id: string): Workflow {
  return {
    id,
    organizationId: docData.organizationId as string,
    channelId: docData.channelId as string,
    name: docData.name as string,
    description: docData.description as string | undefined,
    nodes: docData.nodes as WorkflowNode[],
    edges: docData.edges as WorkflowEdge[],
    viewport: docData.viewport as
      | { x: number; y: number; zoom: number }
      | undefined,
    isActive: docData.isActive as boolean,
    triggerCount: (docData.triggerCount as number) || 0,
    lastTriggeredAt: docData.lastTriggeredAt
      ? (docData.lastTriggeredAt as Timestamp).toDate()
      : undefined,
    createdAt: (docData.createdAt as Timestamp).toDate(),
    updatedAt: (docData.updatedAt as Timestamp).toDate(),
    createdBy: docData.createdBy as string,
  };
}

/**
 * Create a new automation/workflow
 */
export async function createAutomation(
  organizationId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    channelId: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewport?: { x: number; y: number; zoom: number };
    isActive?: boolean;
  }
): Promise<string> {
  const automationsRef = collection(
    db,
    "organizations",
    organizationId,
    "automations"
  );
  const automationId = generateAutomationId();
  const newAutomationRef = doc(automationsRef, automationId);
  const now = Timestamp.now();

  const automation = {
    id: automationId,
    organizationId,
    channelId: data.channelId,
    name: data.name,
    description: data.description || null,
    nodes: data.nodes,
    edges: data.edges,
    viewport: data.viewport || null,
    isActive: data.isActive ?? false,
    triggerCount: 0,
    lastTriggeredAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };

  await setDoc(newAutomationRef, automation);
  return automationId;
}

/**
 * Get all automations for an organization
 */
export async function getAutomationsByOrganization(
  organizationId: string
): Promise<Workflow[]> {
  const automationsRef = collection(
    db,
    "organizations",
    organizationId,
    "automations"
  );
  const q = query(automationsRef, orderBy("createdAt", "desc"));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => docToWorkflow(doc.data(), doc.id));
}

/**
 * Get all active automations for a specific channel
 * Used by webhook processing to find matching automations
 */
export async function getActiveAutomationsByChannel(
  organizationId: string,
  channelId: string
): Promise<Workflow[]> {
  const automationsRef = collection(
    db,
    "organizations",
    organizationId,
    "automations"
  );
  const q = query(
    automationsRef,
    where("channelId", "==", channelId),
    where("isActive", "==", true)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => docToWorkflow(doc.data(), doc.id));
}

/**
 * Get a single automation by ID
 */
export async function getAutomation(
  organizationId: string,
  automationId: string
): Promise<Workflow | null> {
  const automationRef = doc(
    db,
    "organizations",
    organizationId,
    "automations",
    automationId
  );
  const automationSnap = await getDoc(automationRef);

  if (!automationSnap.exists()) {
    return null;
  }

  return docToWorkflow(automationSnap.data(), automationSnap.id);
}

/**
 * Update an automation
 */
export async function updateAutomation(
  organizationId: string,
  automationId: string,
  updates: Partial<
    Omit<Workflow, "id" | "organizationId" | "createdAt" | "createdBy">
  >
): Promise<void> {
  const automationRef = doc(
    db,
    "organizations",
    organizationId,
    "automations",
    automationId
  );

  // Filter out undefined values for Firestore
  const cleanUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  await updateDoc(automationRef, cleanUpdates);
}

/**
 * Delete an automation
 */
export async function deleteAutomation(
  organizationId: string,
  automationId: string
): Promise<void> {
  const automationRef = doc(
    db,
    "organizations",
    organizationId,
    "automations",
    automationId
  );
  await deleteDoc(automationRef);
}

/**
 * Toggle an automation's active status
 */
export async function toggleAutomationActive(
  organizationId: string,
  automationId: string
): Promise<boolean> {
  const automation = await getAutomation(organizationId, automationId);
  if (!automation) {
    throw new Error("Automation not found");
  }

  const newActiveState = !automation.isActive;
  await updateAutomation(organizationId, automationId, {
    isActive: newActiveState,
  });
  return newActiveState;
}

/**
 * Increment the trigger count for an automation
 * Called when a webhook triggers an automation
 */
export async function incrementTriggerCount(
  organizationId: string,
  automationId: string
): Promise<void> {
  const automationRef = doc(
    db,
    "organizations",
    organizationId,
    "automations",
    automationId
  );

  await updateDoc(automationRef, {
    triggerCount: increment(1),
    lastTriggeredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// HELPER FUNCTIONS FOR WEBHOOK PROCESSING
// ============================================================================

/**
 * Extract trigger configuration from a workflow
 * Returns the first trigger node's data
 */
export function extractTriggerConfig(
  workflow: Workflow
): TriggerNodeData | null {
  const triggerNode = workflow.nodes.find(
    (node) => node.type === "trigger" && isTriggerNode(node.data)
  );

  if (!triggerNode || !isTriggerNode(triggerNode.data)) {
    return null;
  }

  return triggerNode.data;
}

/**
 * Check if a message matches the automation's trigger keywords
 */
export function matchesKeywords(
  text: string,
  keywords: string[],
  matchType: "exact" | "contains" | "starts_with",
  caseSensitive: boolean
): boolean {
  if (keywords.length === 0) {
    // No keywords means match all messages
    return true;
  }

  const normalizedText = caseSensitive ? text : text.toLowerCase();

  return keywords.some((keyword) => {
    const normalizedKeyword = caseSensitive ? keyword : keyword.toLowerCase();

    switch (matchType) {
      case "exact":
        return normalizedText === normalizedKeyword;
      case "starts_with":
        return normalizedText.startsWith(normalizedKeyword);
      case "contains":
      default:
        return normalizedText.includes(normalizedKeyword);
    }
  });
}

/**
 * Check if a comment is on a specific post (for post_comment triggers)
 */
export function matchesPostFilter(
  mediaId: string,
  postIds: string[] | undefined
): boolean {
  // If no postIds filter, match all posts
  if (!postIds || postIds.length === 0) {
    return true;
  }

  return postIds.includes(mediaId);
}
