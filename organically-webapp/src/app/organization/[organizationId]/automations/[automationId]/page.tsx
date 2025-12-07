"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import {
  Automation,
  AutomationFormData,
  defaultAutomationFormData,
} from "@/types/automation";
import { AutomationBuilder } from "@/components/automations/AutomationBuilder";
import { Button } from "@/components/ui/button";
import { Zap, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock function to simulate loading automation
const loadAutomation = async (id: string): Promise<Automation | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (id === "new") return null;

  return {
    id,
    organizationId: "org1",
    channelId: "ch1",
    name: "Welcome Message",
    description: "Auto-reply to DMs",
    trigger: {
      type: "dm_keyword",
      keywords: ["Help"],
      matchType: "contains",
      caseSensitive: false,
    },
    action: {
      type: "send_ai_response",
      aiPrompt:
        "The user's input while always leading the conversation towards them signing up to learn more or joining the program.",
      delaySeconds: 0,
    },
    isActive: false,
    triggerCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Header action components to avoid re-creating on every render
function SaveStatus({ saving }: { saving: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span>All states are automatically saved</span>
        </>
      )}
    </div>
  );
}

function ActivateButton({
  isActive,
  onActivate,
}: {
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <Button
      onClick={onActivate}
      className={cn(
        "gap-2",
        isActive
          ? "bg-green-600 hover:bg-green-700"
          : "bg-primary hover:bg-primary/90"
      )}
    >
      <Zap className="w-4 h-4" />
      {isActive ? "Active" : "Activate"}
    </Button>
  );
}

export default function AutomationEditorPage() {
  const params = useParams();
  const { activeOrganization } = useOrganization();
  const breadcrumb = useBreadcrumb();

  // Store breadcrumb functions in refs to avoid dependency issues
  const breadcrumbRef = useRef(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  const automationId = params.automationId as string;
  const isNew = automationId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [name, setName] = useState("Untitled Automation");
  const [formData, setFormData] = useState<AutomationFormData>(
    defaultAutomationFormData
  );
  const [mounted, setMounted] = useState(false);

  // Handle activate toggle
  const handleActivate = useCallback(() => {
    setIsActive((prev) => {
      const newState = !prev;
      toast.success(
        newState ? "Automation activated" : "Automation deactivated"
      );
      return newState;
    });
  }, []);

  // Handle title change from layout
  const handleTitleChange = useCallback((newTitle: string) => {
    setName(newTitle);
    breadcrumbRef.current.setCustomTitle(newTitle);
    setSaving(true);
    setTimeout(() => setSaving(false), 500);
  }, []);

  // Initial setup - run once on mount
  useEffect(() => {
    setMounted(true);
    breadcrumbRef.current.setIsEditableTitle(true);
    breadcrumbRef.current.setOnTitleChange(handleTitleChange);

    return () => {
      breadcrumbRef.current.setCustomTitle(null);
      breadcrumbRef.current.setIsEditableTitle(false);
      breadcrumbRef.current.setOnTitleChange(null);
      breadcrumbRef.current.clearHeaderActions();
    };
  }, [handleTitleChange]);

  // Update header actions when saving or isActive changes
  useEffect(() => {
    if (!mounted) return;

    breadcrumbRef.current.setHeaderActions([
      {
        id: "save-status",
        content: <SaveStatus saving={saving} />,
      },
      {
        id: "activate-button",
        content: (
          <ActivateButton isActive={isActive} onActivate={handleActivate} />
        ),
      },
    ]);
  }, [saving, isActive, handleActivate, mounted]);

  // Load automation data
  useEffect(() => {
    async function load() {
      if (isNew) {
        breadcrumbRef.current.setCustomTitle("New Automation");
        setName("New Automation");
        return;
      }

      setLoading(true);
      const automation = await loadAutomation(automationId);
      if (automation) {
        setName(automation.name);
        breadcrumbRef.current.setCustomTitle(automation.name);
        setIsActive(automation.isActive);
        setFormData({
          name: automation.name,
          description: automation.description || "",
          channelId: automation.channelId,
          trigger: {
            type: automation.trigger.type,
            keywords: automation.trigger.keywords,
            matchType: automation.trigger.matchType,
            caseSensitive: automation.trigger.caseSensitive,
            postIds: automation.trigger.postIds || [],
          },
          action: {
            type: automation.action.type,
            messageTemplate: automation.action.messageTemplate || "",
            aiPrompt:
              automation.action.aiPrompt ||
              defaultAutomationFormData.action.aiPrompt,
            delaySeconds: automation.action.delaySeconds || 0,
          },
          isActive: automation.isActive,
        });
      }
      setLoading(false);
    }
    load();
  }, [automationId, isNew]);

  // Auto-save functionality
  const handleChange = useCallback((data: AutomationFormData) => {
    setFormData(data);
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 -mx-16 -mb-16 bg-muted/30">
      <AutomationBuilder
        initialData={formData}
        onChange={handleChange}
        onActivate={handleActivate}
        isActive={isActive}
        isSaving={saving}
      />
    </div>
  );
}
