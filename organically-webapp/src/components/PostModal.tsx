"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PostEditor, SaveStatus } from "@/components/PostEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CircleDot,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPost,
  updatePost,
  reorderPosts,
  deletePost,
} from "@/services/postService";
import { Post, PostStatus, PostType, PostPlatform, PostMedia } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";
import { POST_TYPES, getAllowedPlatformsForType } from "@/lib/post-constants";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { InstagramEmbedPreview, MediaUpload, IPhoneFrame } from "@/components/instagram-preview";
import { useOrganization } from "@/contexts/OrganizationContext";

// Status configuration with colors
const statusConfig: Record<
  PostStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  idea: {
    label: "Idea",
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
  },
  draft: {
    label: "Draft",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  ready: {
    label: "Ready",
    dotColor: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    textColor: "text-green-700 dark:text-green-300",
  },
  posted: {
    label: "Posted",
    dotColor: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    textColor: "text-purple-700 dark:text-purple-300",
  },
};

const statusGroups = [
  { label: "Planning", statuses: ["idea"] as PostStatus[] },
  { label: "In Progress", statuses: ["draft"] as PostStatus[] },
  { label: "Complete", statuses: ["ready", "posted"] as PostStatus[] },
];

interface PostModalProps {
  post?: Post | null; // If null/undefined, we're creating a new post
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: (post: Post) => void;
  onPostUpdated?: (post: Post) => void;
  onPostDeleted?: (postId: string) => void;
  organizationId: string;
  userId: string;
}

const getDefaultPost = (): Omit<Post, "id" | "createdAt" | "updatedAt"> => ({
  organizationId: "",
  userId: "",
  title: "",
  content: "",
  platforms: [],
  status: "idea",
  order: 0,
  media: [],
});

export function PostModal({
  post,
  open,
  onOpenChange,
  onPostCreated,
  onPostUpdated,
  onPostDeleted,
  organizationId,
  userId,
}: PostModalProps) {
  const { activeOrganization } = useOrganization();
  const isEditMode = !!post;
  const [editedPost, setEditedPost] = useState<
    Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }
  >(getDefaultPost());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Media state (local blob URLs until post is saved)
  const [localMedia, setLocalMedia] = useState<PostMedia[]>([]);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Get username from channel or organization
  const username = activeOrganization?.channels?.[0]?.accountName || 
    activeOrganization?.name?.toLowerCase().replace(/\s+/g, '') || 
    "username";
  const profileImage = activeOrganization?.channels?.[0]?.profileImageUrl || 
    activeOrganization?.imageUrl;

  // Initialize edited post when post changes or modal opens
  useEffect(() => {
    if (open) {
      if (post) {
        setEditedPost(post);
        setLocalMedia(post.media || []);
        lastSavedRef.current = JSON.stringify({
          title: post.title,
          content: post.content,
          scheduledDate: post.scheduledDate?.getTime(),
          status: post.status,
          type: post.type,
          platforms: post.platforms,
        });
      } else {
        // Reset to default for new post
        setEditedPost({
          ...getDefaultPost(),
          organizationId,
          userId,
        });
        setLocalMedia([]);
        lastSavedRef.current = "";
      }
    }
  }, [post, open, organizationId, userId]);

  // Cleanup local blob URLs on unmount
  useEffect(() => {
    return () => {
      localMedia.forEach((m) => {
        if (m.url.startsWith("blob:")) {
          URL.revokeObjectURL(m.url);
        }
        if (m.thumbnailUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(m.thumbnailUrl);
        }
      });
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  // Debounced save for content changes (only in edit mode)
  const debouncedSave = useCallback(
    async (
      postToSave: Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }
    ) => {
      if (!isEditMode || !postToSave.id) return;

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      const snapshot = JSON.stringify({
        title: postToSave.title,
        content: postToSave.content,
        scheduledDate: postToSave.scheduledDate?.getTime(),
        status: postToSave.status,
        type: postToSave.type,
        platforms: postToSave.platforms,
      });

      if (snapshot === lastSavedRef.current) {
        return;
      }

      try {
        setSaveStatus("saving");
        await updatePost(postToSave.id, {
          title: postToSave.title,
          content: postToSave.content,
          scheduledDate: postToSave.scheduledDate,
          type: postToSave.type,
          platforms: postToSave.platforms,
        });
        lastSavedRef.current = snapshot;
        onPostUpdated?.(postToSave as Post);
        setSaveStatus("saved");

        savedTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Error saving post:", error);
        toast.error("Failed to save post");
        setSaveStatus("idle");
      }
    },
    [isEditMode, onPostUpdated]
  );

  // Handle content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      if (!editedPost) return;

      const updatedPost = { ...editedPost, content };
      setEditedPost(updatedPost);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(updatedPost);
      }, 1500);
    },
    [editedPost, debouncedSave]
  );

  // Handle field blur save (immediate)
  const handleFieldSave = async () => {
    if (!editedPost) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await debouncedSave(editedPost);
  };

  const handleStatusChange = async (newStatus: PostStatus) => {
    if (!editedPost) return;

    if (isEditMode && editedPost.id) {
      try {
        await reorderPosts([
          { id: editedPost.id, order: editedPost.order, status: newStatus },
        ]);
        const updatedPost = { ...editedPost, status: newStatus };
        setEditedPost(updatedPost);
        onPostUpdated?.(updatedPost as Post);
        toast.success("Status updated!");
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      }
    } else {
      setEditedPost({ ...editedPost, status: newStatus });
    }
  };

  const handleDelete = async () => {
    if (!editedPost || !editedPost.id) return;

    try {
      setIsDeleting(true);
      await deletePost(editedPost.id);
      onPostDeleted?.(editedPost.id);
      onOpenChange(false);
      toast.success("Post deleted!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!editedPost.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (editedPost.platforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    try {
      setIsSaving(true);
      const newPost = await createPost({
        organizationId,
        userId,
        title: editedPost.title.trim(),
        content: editedPost.content.trim(),
        platforms: editedPost.platforms,
        type: editedPost.type,
        status: editedPost.status,
        scheduledDate: editedPost.scheduledDate,
        media: localMedia, // Include media
      });
      onPostCreated?.(newPost);
      onOpenChange(false);
      toast.success("Post created!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlatform = (platformId: PostPlatform) => {
    if (!editedPost) return;

    let newPlatforms: PostPlatform[];
    if (editedPost.platforms.includes(platformId)) {
      newPlatforms = editedPost.platforms.filter((p) => p !== platformId);
    } else {
      newPlatforms = [...editedPost.platforms, platformId];
    }
    const updatedPost = { ...editedPost, platforms: newPlatforms };
    setEditedPost(updatedPost);
  };

  const handleMediaChange = (media: PostMedia[]) => {
    setLocalMedia(media);
    setEditedPost({ ...editedPost, media });
  };

  if (!editedPost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] w-[95vw] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{isEditMode ? "Edit Post" : "Create Post"}</DialogTitle>
        </VisuallyHidden>
        <div className="grid grid-cols-[1fr_380px] min-h-[600px] max-h-[90vh]">
          {/* Left Side - Settings & Content Editor */}
          <div className="flex flex-col border-r border-border">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold">
                {isEditMode ? "Edit Post" : "Create Post"}
              </h3>
            </div>

            {/* Settings Section */}
            <div className="p-4 border-b border-border space-y-4">
              {/* Title Input */}
              <Input
                value={editedPost.title}
                onChange={(e) =>
                  setEditedPost({ ...editedPost, title: e.target.value })
                }
                onBlur={handleFieldSave}
                placeholder="Post title..."
                className="text-lg font-medium"
              />

              {/* Inline Settings Row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Platform Icons */}
                <div className="flex items-center gap-1">
                  {PLATFORMS.filter((p) =>
                    getAllowedPlatformsForType(editedPost.type).includes(
                      p.id as PostPlatform
                    )
                  ).map((platform) => {
                    const isSelected = editedPost.platforms.includes(
                      platform.id as PostPlatform
                    );
                    return (
                      <button
                        key={platform.id}
                        onClick={() =>
                          togglePlatform(platform.id as PostPlatform)
                        }
                        className={cn(
                          "relative p-1.5 rounded-full transition-all",
                          isSelected
                            ? "bg-muted ring-2 ring-primary"
                            : "bg-muted/50 hover:bg-muted opacity-50"
                        )}
                      >
                        <Image
                          src={platform.logo}
                          alt={platform.name}
                          width={20}
                          height={20}
                          className="shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="h-5 w-px bg-border" />

                {/* Status Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                        statusConfig[editedPost.status].bgColor,
                        statusConfig[editedPost.status].textColor,
                        "hover:opacity-80 transition-opacity cursor-pointer"
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          statusConfig[editedPost.status].dotColor
                        )}
                      />
                      {statusConfig[editedPost.status].label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {statusGroups.map((group, groupIndex) => (
                      <div key={group.label}>
                        {groupIndex > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="text-sm text-muted-foreground font-normal">
                          {group.label}
                        </DropdownMenuLabel>
                        {group.statuses.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className="cursor-pointer"
                          >
                            <span
                              className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                statusConfig[status].dotColor
                              )}
                            />
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded text-sm",
                                statusConfig[status].bgColor,
                                statusConfig[status].textColor
                              )}
                            >
                              {statusConfig[status].label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Type Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                      <CircleDot className="w-3 h-3" />
                      {editedPost.type
                        ? POST_TYPES.find((t) => t.id === editedPost.type)
                            ?.label
                        : "Type"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => setEditedPost({ ...editedPost, type: undefined })}
                    >
                      None
                    </DropdownMenuItem>
                    {POST_TYPES.map((type) => (
                      <DropdownMenuItem
                        key={type.id}
                        onClick={() => {
                          const newAllowedPlatforms = getAllowedPlatformsForType(
                            type.id as PostType
                          );
                          const filteredPlatforms = editedPost.platforms.filter(
                            (p) => newAllowedPlatforms.includes(p)
                          );
                          setEditedPost({
                            ...editedPost,
                            type: type.id as PostType,
                            platforms:
                              filteredPlatforms.length === 0 &&
                              newAllowedPlatforms.length > 0
                                ? [newAllowedPlatforms[0]]
                                : filteredPlatforms,
                          });
                        }}
                      >
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Scheduled Date */}
                <button
                  onClick={() => {
                    const input = document.getElementById("schedule-input") as HTMLInputElement;
                    input?.showPicker?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  {editedPost.scheduledDate
                    ? new Date(editedPost.scheduledDate).toLocaleDateString()
                    : "Schedule"}
                </button>
                <input
                  id="schedule-input"
                  type="datetime-local"
                  value={
                    editedPost.scheduledDate
                      ? new Date(editedPost.scheduledDate)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    setEditedPost({
                      ...editedPost,
                      scheduledDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    });
                  }}
                  onBlur={handleFieldSave}
                  className="sr-only"
                />

                {/* Delete Button - Only in edit mode */}
                {isEditMode && (
                  <>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <PostEditor
                content={editedPost.content}
                onChange={handleContentChange}
                saveStatus={saveStatus}
                placeholder="What's happening?"
              />
            </div>

            {/* Media Upload Section */}
            <div className="p-4 border-t border-border">
              <MediaUpload
                media={localMedia}
                onChange={handleMediaChange}
                maxFiles={10}
              />
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border flex items-center justify-end">
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFieldSave}
                    >
                      Save as draft
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleStatusChange("ready");
                        handleFieldSave();
                      }}
                    >
                      Add to calendar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreate} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Post"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Instagram Embed Preview */}
          <div className="flex flex-col min-w-0 bg-muted/30 p-4 overflow-y-auto">
            <div className="flex-1 flex items-center justify-center">
              <IPhoneFrame scale={0.6} screenBackground="transparent">
                <div className="h-full overflow-y-auto bg-white dark:bg-black">
                  <InstagramEmbedPreview
                    media={localMedia}
                    caption={editedPost.content || editedPost.title}
                    username={username}
                    profileImage={profileImage || undefined}
                    width="100%"
                    captioned
                  />
                </div>
              </IPhoneFrame>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
