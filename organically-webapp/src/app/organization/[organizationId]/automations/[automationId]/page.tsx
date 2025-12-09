"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { WorkflowCanvas } from "@/components/workflows";
import {
  WorkflowNode,
  WorkflowEdge,
  defaultTriggerData,
} from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Zap, ZapOff, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        label: "When someone DMs",
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
  const { activeOrganization } = useOrganization();
  const breadcrumb = useBreadcrumb();

  // Store breadcrumb functions in refs to avoid dependency issues
  const breadcrumbRef = useRef(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  const workflowId = params.automationId as string;
  const isNew = workflowId === "new";

  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [name, setName] = useState("New Workflow");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [mounted, setMounted] = useState(false);

  // Track current canvas state for header save button
  const currentNodesRef = useRef<WorkflowNode[]>([]);
  const currentEdgesRef = useRef<WorkflowEdge[]>([]);

  const handleCanvasChange = useCallback(
    (newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
      currentNodesRef.current = newNodes;
      currentEdgesRef.current = newEdges;
    },
    []
  );

  // Handle activate toggle
  const handleActivate = useCallback(() => {
    if (!isValid && !isActive) {
      toast.error("Please fix validation errors first");
      return;
    }

    setIsActive((prev) => {
      const newState = !prev;
      toast.success(newState ? "Workflow activated!" : "Workflow deactivated");
      return newState;
    });
  }, [isValid, isActive]);

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

    // Initialize with default workflow
    const defaultWf = getDefaultWorkflow();
    setNodes(defaultWf.nodes);
    setEdges(defaultWf.edges);
    setName(isNew ? "New Workflow" : "Workflow Editor");
    breadcrumbRef.current.setCustomTitle(
      isNew ? "New Workflow" : "Workflow Editor"
    );

    return () => {
      breadcrumbRef.current.setCustomTitle(null);
      breadcrumbRef.current.setIsEditableTitle(false);
      breadcrumbRef.current.setOnTitleChange(null);
      breadcrumbRef.current.clearHeaderActions();
    };
  }, [handleTitleChange, isNew]);

  // Save handler (local only for now)
  const handleSave = useCallback(
    (newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
      setSaving(true);

      // Simulate save delay
      setTimeout(() => {
        setNodes(newNodes);
        setEdges(newEdges);
        setSaving(false);
        toast.success("Workflow saved! (local only)");
        console.log("Saved workflow:", {
          name,
          nodes: newNodes,
          edges: newEdges,
        });
      }, 500);
    },
    [name]
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
