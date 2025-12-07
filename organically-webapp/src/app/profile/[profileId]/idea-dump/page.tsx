"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Lightbulb, Loader2, GripVertical, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Editor } from "@/components/Editor";
import { IdeaModal } from "@/components/IdeaModal";
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
        "aspect-square p-5 bg-linear-to-br from-white to-yellow-50 group relative",
        "shadow-[2px_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.08)]",
        "hover:shadow-[3px_3px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]",
        "transition-all duration-200",
        isDragging && !isDragOverlay && "opacity-50",
        isDragOverlay &&
          "shadow-[4px_4px_16px_rgba(0,0,0,0.2)] ring-2 ring-yellow-400/50 rotate-2"
      )}
    >
      <div className="flex flex-col h-full relative">
        {/* Drag Handle - Top Right */}
        <button
          {...attributes}
          {...listeners}
          className="absolute -top-2 -right-2 p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Card Content - Clickable */}
        <div
          className="flex-1 cursor-pointer hover:opacity-80 transition-opacity flex flex-col"
          onClick={onClick}
        >
          <h3 className="font-semibold line-clamp-2 text-gray-900 mb-2">
            {idea.title}
          </h3>
          {idea.content && (
            <p className="text-sm text-gray-600 line-clamp-3 flex-1">
              {idea.content}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-auto pt-3">
            <Calendar className="w-3 h-3" />
            {new Date(idea.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Idea Card for Drag Overlay (non-sortable version)
function IdeaCardOverlay({ idea }: { idea: Idea }) {
  return (
    <div className="aspect-square p-5 bg-linear-to-br from-white to-yellow-50 shadow-[4px_4px_16px_rgba(0,0,0,0.2)] ring-2 ring-yellow-400/50 rotate-2 relative">
      <div className="flex flex-col h-full relative">
        <div className="absolute -top-2 -right-2 p-1.5 text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold line-clamp-2 text-gray-900 mb-2">
            {idea.title}
          </h3>
          {idea.content && (
            <p className="text-sm text-gray-600 line-clamp-3 flex-1">
              {idea.content}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-auto pt-3">
            <Calendar className="w-3 h-3" />
            {new Date(idea.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IdeaDumpPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal state
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);

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

  const loadIdeas = useCallback(async () => {
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
  }, [activeProfile]);

  // Load ideas
  useEffect(() => {
    if (activeProfile) {
      loadIdeas();
    }
  }, [activeProfile, loadIdeas]);

  // Open idea in modal
  const handleOpenIdea = (idea: Idea) => {
    setSelectedIdeaId(idea.id);
    setShowIdeaModal(true);
  };

  // Handle idea update from modal
  const handleIdeaUpdated = (updatedIdea: Idea) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === updatedIdea.id ? updatedIdea : i))
    );
  };

  // Handle idea deletion from modal
  const handleIdeaDeleted = (ideaId: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
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
        content: content.trim(),
      });
      setIdeas((prev) => [...prev, newIdea]);
      toast.success("Idea added!");
      setIsDialogOpen(false);
      setTitle("");
      setContent("");
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

      {/* Ideas Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedIdeas.map((idea) => (
                <SortableIdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => handleOpenIdea(idea)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeIdea ? <IdeaCardOverlay idea={activeIdea} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add Idea Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Add New Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {/* Title - Large editable heading */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              disabled={saving}
              className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
            />

            <Separator className="my-6" />

            {/* Content Editor - Notion-style (no default toolbar) */}
            <Editor
              content={content}
              onChange={setContent}
              placeholder="Describe your idea..."
              showToolbar={false}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setTitle("");
                setContent("");
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

      {/* Idea Modal */}
      <IdeaModal
        ideaId={selectedIdeaId}
        open={showIdeaModal}
        onOpenChange={setShowIdeaModal}
        onIdeaUpdated={handleIdeaUpdated}
        onIdeaDeleted={handleIdeaDeleted}
      />
    </div>
  );
}
