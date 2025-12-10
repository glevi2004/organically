"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Loader2 } from "lucide-react";
import { Workflow } from "@/types/workflow";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import {
  getAutomationsByOrganization,
  toggleAutomationActive,
  deleteAutomation,
} from "@/services/automationService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Header action component
function CreateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="gap-2">
      <Plus className="w-4 h-4" />
      New Workflow
    </Button>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const breadcrumb = useBreadcrumb();
  const breadcrumbRef = useRef(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    router.push(`/organization/${activeOrganization?.id}/automations/new`);
  }, [router, activeOrganization?.id]);

  // Fetch workflows
  useEffect(() => {
    async function fetchWorkflows() {
      if (!activeOrganization?.id) return;

      try {
        setLoading(true);
        const data = await getAutomationsByOrganization(activeOrganization.id);
        setWorkflows(data);
      } catch (error) {
        console.error("Error fetching workflows:", error);
        toast.error("Failed to load workflows");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, [activeOrganization?.id]);

  // Set up header actions
  useEffect(() => {
    breadcrumbRef.current.setHeaderActions([
      {
        id: "create-button",
        content: <CreateButton onClick={handleCreate} />,
      },
    ]);

    return () => {
      breadcrumbRef.current.clearHeaderActions();
    };
  }, [handleCreate]);

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!activeOrganization?.id) return;

    try {
      await toggleAutomationActive(activeOrganization.id, id);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive } : w))
      );
      toast.success(isActive ? "Workflow activated" : "Workflow paused");
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow");
    }
  };

  const handleEdit = (workflow: Workflow) => {
    router.push(
      `/organization/${activeOrganization?.id}/automations/${workflow.id}`
    );
  };

  const handleDeleteClick = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeOrganization?.id || !workflowToDelete) return;

    try {
      await deleteAutomation(activeOrganization.id, workflowToDelete);
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowToDelete));
      toast.success("Workflow deleted");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    } finally {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-card border rounded-2xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Create automated workflows to engage with your audience.
          </p>
        </div>

        {workflows.length === 0 ? (
          /* Empty state */
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first workflow to automatically respond to DMs and
              comments.
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Workflow
            </Button>
          </div>
        ) : (
          /* Workflow grid */
          <div className="grid gap-4 md:grid-cols-2">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
