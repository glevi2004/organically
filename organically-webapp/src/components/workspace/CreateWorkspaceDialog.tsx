"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["🌱", "💼", "🚀", "🎨", "📱", "💡", "🎯", "⚡", "🔥", "✨"];

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🌱");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setLoading(true);

    try {
      const workspaceId = await createWorkspace({
        name: workspaceName.trim(),
        description: description.trim(),
        icon: selectedIcon,
      });

      toast.success("Workspace created successfully!");
      
      // Reset form
      setWorkspaceName("");
      setDescription("");
      setSelectedIcon("🌱");
      onOpenChange(false);
      
      // Navigate to new workspace
      router.push(`/workspace/${workspaceId}/dashboard`);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your content for different brands
            or projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Workspace Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedIcon === emoji
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="dialog-workspace-name">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-workspace-name"
              type="text"
              placeholder="e.g., Personal Brand, Startup, Agency"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {workspaceName.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="dialog-description">Description (Optional)</Label>
            <Input
              id="dialog-description"
              type="text"
              placeholder="What's this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/100 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

