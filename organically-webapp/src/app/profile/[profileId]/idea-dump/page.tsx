"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Lightbulb, Loader2, GripVertical, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  createIdea,
  getIdeasByProfile,
  reorderIdeas,
} from "@/services/ideaService";
import { Idea } from "@/types/idea";
import { cn } from "@/lib/utils";

// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Idea Card Component
interface SortableIdeaCardProps {
  idea: Idea;
  onClick: () => void;
  isDragOverlay?: boolean;
}

function SortableIdeaCard({
  idea,
  onClick,
  isDragOverlay = false,
}: SortableIdeaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-lg bg-background group",
        isDragging && !isDragOverlay && "opacity-50",
        isDragOverlay && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Lightbulb icon */}
        <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-500 shrink-0" />

        {/* Card Content - Clickable */}
        <div
          className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onClick}
        >
          <h3 className="font-semibold line-clamp-1">{idea.title}</h3>
          {idea.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {idea.content}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -mr-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Idea Card for Drag Overlay (non-sortable version)
function IdeaCardOverlay({ idea }: { idea: Idea }) {
  return (
    <div className="p-4 border rounded-lg bg-background shadow-lg ring-2 ring-primary">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-500 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold line-clamp-1">{idea.title}</h3>
          {idea.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {idea.content}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-0.5 p-1 -mr-1 text-muted-foreground">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export default function IdeaDumpPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort ideas by order
  const sortedIdeas = useMemo(
    () => [...ideas].sort((a, b) => a.order - b.order),
    [ideas]
  );

  // Get the active idea being dragged
  const activeIdea = useMemo(() => {
    if (!activeId) return null;
    return ideas.find((i) => i.id === activeId) || null;
  }, [activeId, ideas]);

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

  // Navigate to idea edit page
  const handleOpenIdea = (idea: Idea) => {
    router.push(`/profile/${activeProfile?.id}/idea-dump/${idea.id}`);
  };

  const handleAddIdea = async () => {
    if (!title.trim() || !activeProfile || !user) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setSaving(true);
      const newIdea = await createIdea({
        profileId: activeProfile.id,
        userId: user.uid,
        title: title.trim(),
      });
      setIdeas((prev) => [...prev, newIdea]);
      toast.success("Idea added!");
      setIsDialogOpen(false);
      setTitle("");
    } catch (error) {
      console.error("Error adding idea:", error);
      toast.error("Failed to add idea");
    } finally {
      setSaving(false);
    }
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sortedIdeas.findIndex((i) => i.id === active.id);
    const newIndex = sortedIdeas.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newIdeas = [...sortedIdeas];
    const [movedIdea] = newIdeas.splice(oldIndex, 1);
    newIdeas.splice(newIndex, 0, movedIdea);

    // Update orders
    const updates: Array<{ id: string; order: number }> = [];
    newIdeas.forEach((idea, index) => {
      if (idea.order !== index) {
        updates.push({ id: idea.id, order: index });
      }
    });

    // Update local state with new orders
    setIdeas(newIdeas.map((idea, index) => ({ ...idea, order: index })));

    try {
      await reorderIdeas(updates);
    } catch (error) {
      console.error("Error reordering ideas:", error);
      toast.error("Failed to reorder ideas");
      loadIdeas(); // Reload to restore correct state
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span className="text-muted-foreground">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </span>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Idea
        </Button>
      </div>

      {/* Ideas List with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedIdeas.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No ideas yet. Click "Add Idea" to get started!
              </p>
            </div>
          ) : (
            <SortableContext
              items={sortedIdeas.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedIdeas.map((idea) => (
                <SortableIdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => handleOpenIdea(idea)}
                />
              ))}
            </SortableContext>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeIdea ? <IdeaCardOverlay idea={activeIdea} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add Idea Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="What's your idea?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) {
                  handleAddIdea();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setTitle("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddIdea} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
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
