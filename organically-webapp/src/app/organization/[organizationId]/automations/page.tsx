"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Zap, Plus } from "lucide-react";

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

  const handleCreate = useCallback(() => {
    router.push(`/organization/${activeOrganization?.id}/automations/new`);
  }, [router, activeOrganization?.id]);

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

        {/* Empty state */}
        <div className="py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first workflow to automatically respond to DMs and comments.
          </p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
