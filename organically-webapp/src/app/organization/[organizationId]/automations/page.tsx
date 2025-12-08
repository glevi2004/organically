"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Automation } from "@/types/automation";
import { Button } from "@/components/ui/button";
import { Check, Zap, Plus } from "lucide-react";

// Mock data for demonstration
const mockAutomations: Automation[] = [
  {
    id: "1",
    organizationId: "org1",
    channelId: "ch1",
    name: "Direct traffic towards website",
    description: "Send a welcome message when someone DMs 'hello' or 'hi'",
    trigger: {
      type: "dm_keyword",
      keywords: ["hello", "hi", "hey"],
      matchType: "contains",
      caseSensitive: false,
    },
    action: {
      type: "send_dm",
      messageTemplate:
        "Hey {{username}}! 👋 Thanks for reaching out. How can I help you today?",
      delaySeconds: 2,
    },
    isActive: true,
    triggerCount: 156,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date("2024-10-05"),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "2",
    organizationId: "org1",
    channelId: "ch1",
    name: "Direct traffic towards website",
    description: "AI-powered response for pricing inquiries",
    trigger: {
      type: "dm_keyword",
      keywords: ["price", "pricing", "cost", "how much"],
      matchType: "contains",
      caseSensitive: false,
    },
    action: {
      type: "send_ai_response",
      aiPrompt:
        "You are a helpful sales assistant. Respond to pricing questions about our services.",
      delaySeconds: 5,
    },
    isActive: true,
    triggerCount: 89,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date("2024-10-05"),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "3",
    organizationId: "org1",
    channelId: "ch1",
    name: "Direct traffic towards website",
    description: "Thank people who comment 'INFO' on posts",
    trigger: {
      type: "comment_keyword",
      keywords: ["INFO", "info"],
      matchType: "exact",
      caseSensitive: false,
      postIds: [],
    },
    action: {
      type: "send_dm",
      messageTemplate:
        "Hey! Thanks for your interest! Here's the info you requested... 📩",
      delaySeconds: 10,
    },
    isActive: true,
    triggerCount: 42,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date("2024-10-05"),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

function formatDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .replace(/(\d+)/, (match) => {
      const num = parseInt(match);
      const suffix =
        num === 1 || num === 21 || num === 31
          ? "st"
          : num === 2 || num === 22
          ? "nd"
          : num === 3 || num === 23
          ? "rd"
          : "th";
      return `${num}${suffix}`;
    });
}

// Header action component
function CreateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} className="gap-2">
      <Plus className="w-4 h-4" />
      Add Automation
    </Button>
  );
}

export default function AutomationsPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const breadcrumb = useBreadcrumb();
  const breadcrumbRef = useRef(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  const [automations] = useState<Automation[]>(mockAutomations);

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

  const handleEdit = (automation: Automation) => {
    router.push(
      `/organization/${activeOrganization?.id}/automations/${automation.id}`
    );
  };

  return (
    <div className="w-full">
      <div className="bg-card border rounded-2xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground">
            Your live automations will show here.
          </p>
        </div>

        {/* Automations List */}
        {automations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No automations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {automations.map((automation) => (
              <button
                key={automation.id}
                onClick={() => handleEdit(automation)}
                className="w-full flex items-center justify-between py-3 text-left hover:opacity-70 transition-opacity"
              >
                <div>
                  <p className="font-medium">{automation.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(automation.createdAt)}
                  </p>
                </div>
                {automation.isActive && (
                  <Check className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
