"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Automation } from "@/types/automation";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Zap, MessageCircle, AtSign } from "lucide-react";
import { toast } from "sonner";

// Mock data for demonstration
const mockAutomations: Automation[] = [
  {
    id: "1",
    organizationId: "org1",
    channelId: "ch1",
    name: "Welcome Message",
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "2",
    organizationId: "org1",
    channelId: "ch1",
    name: "Pricing Info",
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
        "You are a helpful sales assistant. Respond to pricing questions about our services. Be friendly and offer to schedule a call. The user asked: {{message}}",
      delaySeconds: 5,
    },
    isActive: true,
    triggerCount: 89,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "3",
    organizationId: "org1",
    channelId: "ch1",
    name: "Comment Auto-Reply",
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
    isActive: false,
    triggerCount: 42,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

type FilterType = "all" | "dm_keyword" | "comment_keyword";

export default function AutomationsPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(
    null
  );

  // Filter automations
  const filteredAutomations = automations.filter((automation) => {
    const matchesSearch =
      automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      automation.trigger.keywords.some((k) =>
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      filterType === "all" || automation.trigger.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Stats
  const activeCount = automations.filter((a) => a.isActive).length;
  const totalTriggers = automations.reduce((sum, a) => sum + a.triggerCount, 0);

  const handleToggle = (id: string, isActive: boolean) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive } : a))
    );
    toast.success(isActive ? "Automation enabled" : "Automation paused");
  };

  const handleEdit = (automation: Automation) => {
    router.push(
      `/organization/${activeOrganization?.id}/automations/${automation.id}`
    );
  };

  const handleDelete = (id: string) => {
    setAutomationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (automationToDelete) {
      setAutomations((prev) => prev.filter((a) => a.id !== automationToDelete));
      toast.success("Automation deleted");
    }
    setDeleteDialogOpen(false);
    setAutomationToDelete(null);
  };

  const handleCreate = () => {
    router.push(`/organization/${activeOrganization?.id}/automations/new`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            Automations
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate your Instagram DMs and comment responses
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <div className="p-3 rounded-full bg-green-500/10">
            <Zap className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active Automations</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <div className="p-3 rounded-full bg-blue-500/10">
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalTriggers}</p>
            <p className="text-sm text-muted-foreground">Total Triggers</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <div className="p-3 rounded-full bg-purple-500/10">
            <AtSign className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{automations.length}</p>
            <p className="text-sm text-muted-foreground">Total Automations</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(value: FilterType) => setFilterType(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dm_keyword">DM Keywords</SelectItem>
            <SelectItem value="comment_keyword">Comment Keywords</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Automations List */}
      {filteredAutomations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No automations found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || filterType !== "all"
              ? "Try adjusting your filters"
              : "Create your first automation to get started"}
          </p>
          {!searchQuery && filterType === "all" && (
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Automation
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              automation and all its settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
