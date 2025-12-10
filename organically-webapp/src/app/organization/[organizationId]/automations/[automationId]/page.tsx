"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { WorkflowCanvas } from "@/components/workflows";
import {
  WorkflowNode,
  WorkflowEdge,
  defaultTriggerData,
  Workflow,
} from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Zap, ZapOff, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAutomation,
  createAutomation,
  updateAutomation,
} from "@/services/automationService";

// Default starter workflow for new automations
const getDefaultWorkflow = (): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} => ({
  nodes: [
    {
      id: `trigger-${Date.now()}`,
      type: "trigger",
      position: { x: 150, y: 200 },
      data: {
        ...defaultTriggerData,
        label: "Direct Message",
      },
    },
  ],
  edges: [],
});

// Header action components
function SaveButton({
  onSave,
  isSaving,
}: {
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onSave}
      disabled={isSaving}
      className="gap-2"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Save
        </>
      )}
    </Button>
  );
}

function ActivateButton({
  isActive,
  isValid,
  onActivate,
}: {
  isActive: boolean;
  isValid: boolean;
  onActivate: () => void;
}) {
  return (
    <Button
      onClick={onActivate}
      disabled={!isValid && !isActive}
      className={cn(
        "gap-2",
        isActive
          ? "bg-green-600 hover:bg-green-700"
          : "bg-primary hover:bg-primary/90"
      )}
    >
      {isActive ? (
        <>
          <Zap className="w-4 h-4" />
          Active
        </>
      ) : (
        <>
          <ZapOff className="w-4 h-4" />
          Activate
        </>
      )}
    </Button>
  );
}

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const breadcrumb = useBreadcrumb();

  // Store breadcrumb functions in refs to avoid dependency issues
  const breadcrumbRef = useRef(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  const workflowId = params.automationId as string;
  const isNew = workflowId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [name, setName] = useState("New Workflow");
  const [description, setDescription] = useState<string | undefined>();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [mounted, setMounted] = useState(false);
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(
    isNew ? null : workflowId
  );

  // Track current canvas state for header save button
  const currentNodesRef = useRef<WorkflowNode[]>([]);
  const currentEdgesRef = useRef<WorkflowEdge[]>([]);

  // Load existing workflow
  useEffect(() => {
    async function loadWorkflow() {
      if (isNew || !activeOrganization?.id) {
        setLoading(false);
        return;
      }

      try {
        const workflow = await getAutomation(activeOrganization.id, workflowId);
        if (workflow) {
          setName(workflow.name);
          setDescription(workflow.description);
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
          setIsActive(workflow.isActive);
          breadcrumbRef.current.setCustomTitle(workflow.name);
        } else {
          // Workflow not found, redirect to list
          toast.error("Workflow not found");
          router.push(`/organization/${activeOrganization.id}/automations`);
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        toast.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    }

    loadWorkflow();
  }, [isNew, activeOrganization?.id, workflowId, router]);

  const handleCanvasChange = useCallback(
    (newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
      currentNodesRef.current = newNodes;
      currentEdgesRef.current = newEdges;

      // Update validation state
      const hasTrigger = newNodes.some((n) => n.type === "trigger");
      const hasAction = newNodes.some((n) => n.type === "action");
      setIsValid(hasTrigger && hasAction);
    },
    []
  );

  // Handle activate toggle
  const handleActivate = useCallback(async () => {
    if (!isValid && !isActive) {
      toast.error("Please fix validation errors first");
      return;
    }

    if (!activeOrganization?.id || !savedWorkflowId) {
      toast.error("Please save the workflow first");
      return;
    }

    try {
      const newActiveState = !isActive;
      await updateAutomation(activeOrganization.id, savedWorkflowId, {
        isActive: newActiveState,
      });
      setIsActive(newActiveState);
      toast.success(
        newActiveState ? "Workflow activated!" : "Workflow deactivated"
      );
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow status");
    }
  }, [isValid, isActive, activeOrganization?.id, savedWorkflowId]);

  // Handle title change from layout
  const handleTitleChange = useCallback((newTitle: string) => {
    setName(newTitle);
    breadcrumbRef.current.setCustomTitle(newTitle);
  }, []);

  // Initial setup - run once on mount
  useEffect(() => {
    setMounted(true);
    breadcrumbRef.current.setIsEditableTitle(true);
    breadcrumbRef.current.setOnTitleChange(handleTitleChange);

    if (isNew) {
      // Initialize with default workflow
      const defaultWf = getDefaultWorkflow();
      setNodes(defaultWf.nodes);
      setEdges(defaultWf.edges);
      setName("New Workflow");
      breadcrumbRef.current.setCustomTitle("New Workflow");
    }

    return () => {
      breadcrumbRef.current.setCustomTitle(null);
      breadcrumbRef.current.setIsEditableTitle(false);
      breadcrumbRef.current.setOnTitleChange(null);
      breadcrumbRef.current.clearHeaderActions();
    };
  }, [handleTitleChange, isNew]);

  // Save handler
  const handleSave = useCallback(
    async (newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
      if (!activeOrganization?.id || !user?.uid) {
        toast.error("Unable to save: missing organization or user");
        return;
      }

      // Check if we have at least one channel to assign
      const instagramChannel = activeOrganization.channels?.find(
        (c) => c.provider === "instagram" && c.isActive
      );

      if (!instagramChannel) {
        toast.error("Please connect an Instagram account first");
        return;
      }

      setSaving(true);

      try {
        if (savedWorkflowId) {
          // Update existing workflow
          await updateAutomation(activeOrganization.id, savedWorkflowId, {
            name,
            description,
            nodes: newNodes,
            edges: newEdges,
            channelId: instagramChannel.id,
          });
          toast.success("Workflow saved!");
        } else {
          // Create new workflow
          const newId = await createAutomation(
            activeOrganization.id,
            user.uid,
            {
              name,
              description,
              channelId: instagramChannel.id,
              nodes: newNodes,
              edges: newEdges,
              isActive: false,
            }
          );
          setSavedWorkflowId(newId);

          // Update URL without full navigation
          window.history.replaceState(
            null,
            "",
            `/organization/${activeOrganization.id}/automations/${newId}`
          );

          toast.success("Workflow created!");
        }

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error("Error saving workflow:", error);
        toast.error("Failed to save workflow");
      } finally {
        setSaving(false);
      }
    },
    [activeOrganization, user?.uid, savedWorkflowId, name, description]
  );

  // Save from header button
  const handleHeaderSave = useCallback(() => {
    handleSave(currentNodesRef.current, currentEdgesRef.current);
  }, [handleSave]);

  // Update header actions when state changes
  useEffect(() => {
    if (!mounted) return;

    breadcrumbRef.current.setHeaderActions([
      {
        id: "save-button",
        content: <SaveButton onSave={handleHeaderSave} isSaving={saving} />,
      },
      {
        id: "activate-button",
        content: (
          <ActivateButton
            isActive={isActive}
            isValid={isValid}
            onActivate={handleActivate}
          />
        ),
      },
    ]);
  }, [isActive, isValid, handleActivate, handleHeaderSave, saving, mounted]);

  if (loading) {
    return (
      <div className="flex-1 -mx-16 -mb-16 h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 -mx-16 -mb-16 h-[calc(100vh-8rem)]">
      <WorkflowCanvas
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
        onChange={handleCanvasChange}
        onActivate={handleActivate}
        isActive={isActive}
        isSaving={saving}
        workflowName={name}
      />
    </div>
  );
}
