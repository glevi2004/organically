"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Editor } from "@/components/Editor";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getIdea, updateIdea } from "@/services/ideaService";
import { Idea } from "@/types/idea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface IdeaModalProps {
  ideaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdeaUpdated: (idea: Idea) => void;
  onIdeaDeleted: (ideaId: string) => void;
}

export function IdeaModal({
  ideaId,
  open,
  onOpenChange,
  onIdeaUpdated,
  onIdeaDeleted,
}: IdeaModalProps) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [editedIdea, setEditedIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load idea when modal opens
  useEffect(() => {
    if (open && ideaId) {
      loadIdea();
    } else {
      // Reset state when modal closes
      setIdea(null);
      setEditedIdea(null);
      lastSavedRef.current = "";
    }
  }, [open, ideaId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const loadIdea = async () => {
    if (!ideaId) return;

    try {
      setLoading(true);
      const fetchedIdea = await getIdea(ideaId);
      if (fetchedIdea) {
        setIdea(fetchedIdea);
        setEditedIdea(fetchedIdea);
        lastSavedRef.current = JSON.stringify({
          title: fetchedIdea.title,
          content: fetchedIdea.content,
        });
      } else {
        toast.error("Idea not found");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error loading idea:", error);
      toast.error("Failed to load idea");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced save
  const debouncedSave = useCallback(
    async (ideaToSave: Idea) => {
      const snapshot = JSON.stringify({
        title: ideaToSave.title,
        content: ideaToSave.content,
      });

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
        onIdeaUpdated(ideaToSave);
      } catch (error) {
        console.error("Error saving idea:", error);
        toast.error("Failed to save idea");
      } finally {
        setIsSaving(false);
      }
    },
    [onIdeaUpdated]
  );

  // Handle content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      if (!editedIdea) return;

      const updatedIdea = { ...editedIdea, content };
      setEditedIdea(updatedIdea);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(updatedIdea);
      }, 1500);
    },
    [editedIdea, debouncedSave]
  );

  // Handle title blur save (immediate)
  const handleTitleSave = async () => {
    if (!editedIdea || !idea) return;

    if (idea.title === editedIdea.title) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await debouncedSave(editedIdea);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[90vw] p-0 gap-0 overflow-hidden bg-transparent border-none shadow-none rounded-none">
        <VisuallyHidden>
          <DialogTitle>Edit Idea</DialogTitle>
        </VisuallyHidden>
        {loading ? (
          <div className="flex items-center justify-center min-h-[500px] p-5 bg-linear-to-br from-white to-yellow-50">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        ) : editedIdea ? (
          <div className="relative p-5 min-h-[500px] bg-linear-to-br from-white to-yellow-50">
            <div className="relative flex flex-col h-full">
              {/* Title */}
              <input
                type="text"
                value={editedIdea.title}
                onChange={(e) => {
                  setEditedIdea({ ...editedIdea, title: e.target.value });
                }}
                onBlur={handleTitleSave}
                placeholder="Untitled"
                className="w-full font-semibold bg-transparent border-none outline-none placeholder:text-gray-400 text-gray-900 mb-2 text-lg"
              />

              {/* Content Editor */}
              <>
                <style>{`
                  .idea-modal-editor .post-editor-wrapper {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                  }
                  .idea-modal-editor .post-editor-content {
                    background: transparent !important;
                  }
                  .idea-modal-editor .tiptap {
                    background: transparent !important;
                  }
                  .idea-modal-editor .ProseMirror {
                    background: transparent !important;
                  }
                `}</style>
                <div className="flex-1 overflow-y-auto mb-2 idea-modal-editor">
                  <Editor
                    content={editedIdea.content}
                    onChange={handleContentChange}
                    placeholder="Describe your idea..."
                    showToolbar={false}
                  />
                </div>
              </>

              {/* Created Date */}
              <div className="mt-auto pt-3 border-t border-gray-200/50">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(editedIdea.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Save indicator */}
              {isSaving && (
                <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-gray-500 bg-white/80 px-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
