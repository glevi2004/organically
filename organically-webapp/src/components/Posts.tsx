"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updatePost } from "@/services/postService";
import { Post, PostStatus } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/profile-constants";

const statusOrder: PostStatus[] = ["idea", "draft", "ready", "posted"];

// Helper to get platform icon
const getPlatformIcon = (platformId: string) => {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  return platform?.logo;
};

// Post Editor Component (for right sidebar)
export interface PostEditorProps {
  post: Post;
  onSave: (post: Post) => void;
  onDelete: (postId: string) => void;
  onStatusChange: (postId: string, status: PostStatus) => void;
  onClose: () => void;
}

export function PostEditor({
  post,
  onSave,
  onDelete,
  onStatusChange,
  onClose,
}: PostEditorProps) {
  const [editedPost, setEditedPost] = useState(post);

  // Update local state when post prop changes
  useEffect(() => {
    setEditedPost(post);
  }, [post]);

  const handleSave = async () => {
    try {
      await updatePost(editedPost.id, {
        title: editedPost.title,
        content: editedPost.content,
        notes: editedPost.notes,
      });
      onSave(editedPost);
      toast.success("Post saved!");
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    onDelete(editedPost.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Edit Post</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Platform & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
              {getPlatformIcon(editedPost.platform) && (
                <Image
                  src={getPlatformIcon(editedPost.platform)!}
                  alt={editedPost.platform}
                  width={20}
                  height={20}
                />
              )}
              <span className="capitalize font-medium">
                {editedPost.platform}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={editedPost.status}
              onChange={(e) => {
                const newStatus = e.target.value as PostStatus;
                onStatusChange(editedPost.id, newStatus);
                setEditedPost({ ...editedPost, status: newStatus });
              }}
              className="w-full p-2 border rounded-md bg-background"
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Title / Topic</Label>
          <Input
            value={editedPost.title}
            onChange={(e) =>
              setEditedPost({ ...editedPost, title: e.target.value })
            }
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label>Caption / Content</Label>
          <textarea
            value={editedPost.content}
            onChange={(e) =>
              setEditedPost({ ...editedPost, content: e.target.value })
            }
            rows={10}
            className="w-full p-2 border rounded-md bg-background resize-none"
            placeholder="Write your post content..."
          />
          <p className="text-xs text-muted-foreground">
            {editedPost.content.length} characters
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (Private)</Label>
          <textarea
            value={editedPost.notes || ""}
            onChange={(e) =>
              setEditedPost({ ...editedPost, notes: e.target.value })
            }
            rows={3}
            className="w-full p-2 border rounded-md bg-background resize-none"
            placeholder="Add private notes..."
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 p-4 border-t">
        <Button onClick={handleSave} className="flex-1">
          Save Changes
        </Button>
        <Button
          onClick={handleDelete}
          variant="outline"
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
