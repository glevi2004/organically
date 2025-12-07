"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Separator } from "@/components/ui/separator";
import { Editor } from "@/components/Editor";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { getIdea, updateIdea } from "@/services/ideaService";
import { Idea } from "@/types/idea";

export default function IdeaEditPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const { setCustomTitle } = useBreadcrumb();
  const ideaId = params.ideaId as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [editedIdea, setEditedIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load the idea
  useEffect(() => {
    if (ideaId) {
      loadIdea();
    }

    // Clear custom title when leaving the page
    return () => setCustomTitle(null);
  }, [ideaId, setCustomTitle]);

  const loadIdea = async () => {
    try {
      setLoading(true);
      const fetchedIdea = await getIdea(ideaId);
      if (fetchedIdea) {
        setIdea(fetchedIdea);
        setEditedIdea(fetchedIdea);
        setCustomTitle(fetchedIdea.title);
        // Initialize lastSaved ref to prevent unnecessary first save
        lastSavedRef.current = JSON.stringify({
          title: fetchedIdea.title,
          content: fetchedIdea.content,
        });
      } else {
        toast.error("Idea not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading idea:", error);
      toast.error("Failed to load idea");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const debouncedSave = useCallback(async (ideaToSave: Idea) => {
    // Create a snapshot to compare
    const snapshot = JSON.stringify({
      title: ideaToSave.title,
      content: ideaToSave.content,
    });

    // Skip if nothing changed since last save
    if (snapshot === lastSavedRef.current) {
      return;
    }

    try {
      setIsSaving(true);
      await updateIdea(ideaToSave.id, {
        title: ideaToSave.title,
        content: ideaToSave.content,
      });
      lastSavedRef.current = snapshot;
      setIdea(ideaToSave);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast.error("Failed to save idea");
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      if (!editedIdea) return;

      const updatedIdea = { ...editedIdea, content };
      setEditedIdea(updatedIdea);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save (1.5 second delay)
      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(updatedIdea);
      }, 1500);
    },
    [editedIdea, debouncedSave]
  );

  // Handle title blur save (immediate)
  const handleTitleSave = async () => {
    if (!editedIdea || !idea) return;

    // Only save if title changed
    if (idea.title === editedIdea.title) return;

    // Clear any pending content save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await debouncedSave(editedIdea);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!editedIdea) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Idea not found</p>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full space-y-2">
      {/* Title - Large editable heading */}
      <input
        type="text"
        value={editedIdea.title}
        onChange={(e) => {
          setEditedIdea({ ...editedIdea, title: e.target.value });
          setCustomTitle(e.target.value);
        }}
        onBlur={handleTitleSave}
        placeholder="Untitled"
        className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
      />

      {/* Properties */}
      <div className="space-y-3 py-4">
        {/* Created Date */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Created
          </span>
          <span className="text-muted-foreground">
            {new Date(editedIdea.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Content Editor - Notion-style (no default toolbar) */}
      <Editor
        content={editedIdea.content}
        onChange={handleContentChange}
        placeholder="Describe your idea..."
        showToolbar={false}
      />

      {/* Save indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
}
