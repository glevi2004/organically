"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createIdea, getIdeasByProfile, deleteIdea } from "@/services/ideaService";
import { Idea } from "@/types/idea";

export default function IdeaDumpPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Load ideas
  useEffect(() => {
    if (activeProfile) {
      loadIdeas();
    }
  }, [activeProfile]);

  const loadIdeas = async () => {
    if (!activeProfile) return;

    try {
      setLoading(true);
      const fetchedIdeas = await getIdeasByProfile(activeProfile.id);
      setIdeas(fetchedIdeas);
    } catch (error) {
      console.error("Error loading ideas:", error);
      toast.error("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIdea = async () => {
    if (!title.trim() || !description.trim() || !activeProfile || !user) {
      toast.error("Please fill in both title and description");
      return;
    }

    try {
      setSaving(true);
      const newIdea = await createIdea({
        profileId: activeProfile.id,
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
      });
      setIdeas((prev) => [newIdea, ...prev]);
      toast.success("Idea added!");
      setIsDialogOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error adding idea:", error);
      toast.error("Failed to add idea");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      await deleteIdea(ideaId);
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      toast.success("Idea deleted");
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast.error("Failed to delete idea");
    }
  };

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Ideas ({ideas.length})
            </CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Idea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No ideas yet. Click "Add Idea" to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-background"
                >
                  <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-500 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {idea.description}
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteIdea(idea.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Idea Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Idea</DialogTitle>
            <DialogDescription>
              Capture your content ideas for later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Morning Routine Tips"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your idea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setTitle("");
                setDescription("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddIdea} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Idea"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
