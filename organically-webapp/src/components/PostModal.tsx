"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { Loader2, Calendar, Trash2, Send, Instagram } from "lucide-react";
import { toast } from "sonner";
import {
  createPost,
  updatePost,
  reorderPosts,
  deletePost,
} from "@/services/postService";
import {
  uploadPostMedia,
  deletePostMedia,
  isLocalBlobUrl,
} from "@/services/postMediaService";
import {
  Post,
  PostStatus,
  PostPlatform,
  PostMedia,
  LocalMedia,
} from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  InstagramPhonePreview,
  MediaUpload,
} from "@/components/instagram-preview";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRouter } from "next/navigation";

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

// Status groups for the dropdown - "posted" is NOT included because only Inngest can set that
const statusGroups = [
  { label: "Planning", statuses: ["idea"] as PostStatus[] },
  { label: "In Progress", statuses: ["draft"] as PostStatus[] },
  { label: "Complete", statuses: ["ready"] as PostStatus[] },
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
  const router = useRouter();
  const isEditMode = !!post;
  const [editedPost, setEditedPost] = useState<
    Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }
  >(getDefaultPost());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Check if Instagram is connected
  const hasInstagramConnected = activeOrganization?.channels?.some(
    (c) => c.provider === "instagram" && c.isActive
  );

  // Media state (includes local files pending upload)
  const [localMedia, setLocalMedia] = useState<LocalMedia[]>([]);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Get username from channel or organization
  const username =
    activeOrganization?.channels?.[0]?.accountName ||
    activeOrganization?.name?.toLowerCase().replace(/\s+/g, "") ||
    "username";
  const profileImage =
    activeOrganization?.channels?.[0]?.profileImageUrl ||
    activeOrganization?.imageUrl;

  // Initialize edited post when post changes or modal opens
  useEffect(() => {
    if (open) {
      if (post) {
        setEditedPost(post);
        // Mark existing media as already uploaded
        setLocalMedia(
          (post.media || []).map((m) => ({
            ...m,
            isUploaded: true,
          }))
        );
        lastSavedRef.current = JSON.stringify({
          content: post.content,
          scheduledDate: post.scheduledDate?.getTime(),
          status: post.status,
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
      setUploadProgress(null);
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
        content: postToSave.content,
        scheduledDate: postToSave.scheduledDate?.getTime(),
        status: postToSave.status,
        platforms: postToSave.platforms,
      });

      if (snapshot === lastSavedRef.current) {
        return;
      }

      try {
        setSaveStatus("saving");
        await updatePost(postToSave.id, {
          content: postToSave.content,
          scheduledDate: postToSave.scheduledDate,
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

    // Prevent changing status of a posted post
    if (editedPost.status === "posted") {
      toast.error("Cannot change status of a published post");
      return;
    }

    // Prevent manually setting status to "posted" (only Inngest can do this)
    if (newStatus === "posted") {
      toast.error("Posts can only be marked as posted after publishing");
      return;
    }

    if (isEditMode && editedPost.id) {
      try {
        await reorderPosts([
          { id: editedPost.id, order: editedPost.order, status: newStatus },
        ]);
        const updatedPost = { ...editedPost, status: newStatus };
        setEditedPost(updatedPost);
        onPostUpdated?.(updatedPost as Post);

        // If changing to "ready", trigger scheduling if conditions are met
        if (newStatus === "ready") {
          const uploadedMedia = localMedia.filter(
            (m) => m.isUploaded && !isLocalBlobUrl(m.url)
          );
          const scheduledTime = editedPost.scheduledDate
            ? new Date(editedPost.scheduledDate)
            : null;
          const minScheduleTime = Date.now() + 5 * 60 * 1000;

          if (
            scheduledTime &&
            scheduledTime.getTime() >= minScheduleTime &&
            hasInstagramConnected &&
            uploadedMedia.length > 0
          ) {
            // Schedule the post
            const response = await fetch("/api/instagram/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId: editedPost.id,
                organizationId,
                scheduledDate: scheduledTime.toISOString(),
              }),
            });

            if (response.ok) {
              toast.success(
                `Status changed to Ready and scheduled for ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`
              );
              return;
            }
          }
        }

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
    if (editedPost.platforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    try {
      setIsSaving(true);

      // First create the post without media to get an ID
      const newPost = await createPost({
        organizationId,
        userId,
        content: editedPost.content.trim(),
        platforms: editedPost.platforms,
        status: editedPost.status,
        scheduledDate: editedPost.scheduledDate,
      });

      // Upload pending media files
      const pendingMedia = localMedia.filter((m) => m.file && !m.isUploaded);
      let uploadedMedia: PostMedia[] = [];

      if (pendingMedia.length > 0) {
        setUploadProgress(`Uploading 0/${pendingMedia.length} files...`);

        for (let i = 0; i < pendingMedia.length; i++) {
          const media = pendingMedia[i];
          setUploadProgress(
            `Uploading ${i + 1}/${pendingMedia.length} files...`
          );

          try {
            const uploaded = await uploadPostMedia(
              organizationId,
              newPost.id,
              media.file!,
              media.order
            );
            uploadedMedia.push(uploaded);
          } catch (error) {
            console.error(`Failed to upload ${media.file?.name}:`, error);
            toast.error(`Failed to upload ${media.file?.name}`);
          }
        }

        // Update post with uploaded media URLs
        if (uploadedMedia.length > 0) {
          await updatePost(newPost.id, { media: uploadedMedia });
          newPost.media = uploadedMedia;
        }
      }

      // Check if we should schedule the post to Inngest
      // Conditions: status is "ready", has scheduled date 5+ min in future, Instagram connected, has media
      const scheduledTime = editedPost.scheduledDate
        ? new Date(editedPost.scheduledDate)
        : null;
      const minScheduleTime = Date.now() + 5 * 60 * 1000;
      const shouldSchedule =
        editedPost.status === "ready" &&
        scheduledTime &&
        scheduledTime.getTime() >= minScheduleTime &&
        hasInstagramConnected &&
        uploadedMedia.length > 0;

      if (shouldSchedule) {
        setUploadProgress("Scheduling post...");

        const response = await fetch("/api/instagram/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: newPost.id,
            organizationId,
            scheduledDate: scheduledTime.toISOString(),
          }),
        });

        if (response.ok) {
          onPostCreated?.(newPost);
          onOpenChange(false);
          toast.success(
            `Post created and scheduled for ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`
          );
          return;
        }
      }

      onPostCreated?.(newPost);
      onOpenChange(false);
      toast.success("Post created!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
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

  const handleMediaChange = (media: LocalMedia[]) => {
    setLocalMedia(media);
    // Only store non-local media in editedPost (for display purposes)
    const persistedMedia: PostMedia[] = media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      thumbnailUrl: m.thumbnailUrl,
      width: m.width,
      height: m.height,
      order: m.order,
      storagePath: m.storagePath,
      duration: m.duration,
    }));
    setEditedPost({ ...editedPost, media: persistedMedia });
  };

  // Handle publishing to Instagram
  const handlePublishToInstagram = async () => {
    if (!editedPost || !editedPost.id) {
      toast.error("Please save the post first");
      return;
    }

    if (!hasInstagramConnected) {
      router.push(`/organization/${organizationId}/settings`);
      return;
    }

    // Check if post has media
    const uploadedMedia = localMedia.filter(
      (m) => m.isUploaded && !isLocalBlobUrl(m.url)
    );
    if (uploadedMedia.length === 0) {
      toast.error("Please add and save media before publishing");
      return;
    }

    try {
      setIsPublishing(true);

      const response = await fetch("/api/instagram/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editedPost.id,
          organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to publish");
      }

      // Update local state
      const updatedPost = {
        ...editedPost,
        status: "posted" as PostStatus,
        instagramMediaId: result.instagramMediaId,
        publishedAt: new Date(),
      };
      setEditedPost(updatedPost);
      onPostUpdated?.(updatedPost as Post);

      toast.success("Published to Instagram!");
      onOpenChange(false);
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to publish to Instagram"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle saving media for existing posts (edit mode)
  // Also handles scheduling if a future date is set
  const handleSaveWithMedia = async () => {
    if (!editedPost || !editedPost.id) return;

    try {
      setIsSaving(true);

      // Get pending media that needs upload
      const pendingMedia = localMedia.filter((m) => m.file && !m.isUploaded);

      // Get already uploaded media
      const existingMedia = localMedia.filter((m) => m.isUploaded || !m.file);

      let allMedia: PostMedia[] = existingMedia.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        order: m.order,
        storagePath: m.storagePath,
        duration: m.duration,
      }));

      if (pendingMedia.length > 0) {
        setUploadProgress(`Uploading 0/${pendingMedia.length} files...`);

        const newlyUploaded: PostMedia[] = [];

        for (let i = 0; i < pendingMedia.length; i++) {
          const media = pendingMedia[i];
          setUploadProgress(
            `Uploading ${i + 1}/${pendingMedia.length} files...`
          );

          try {
            const uploaded = await uploadPostMedia(
              organizationId,
              editedPost.id,
              media.file!,
              media.order
            );
            newlyUploaded.push(uploaded);
          } catch (error) {
            console.error(`Failed to upload ${media.file?.name}:`, error);
            toast.error(`Failed to upload ${media.file?.name}`);
          }
        }

        // Combine existing and newly uploaded media
        allMedia = [...allMedia, ...newlyUploaded].sort(
          (a, b) => a.order - b.order
        );

        // Update post with all media
        await updatePost(editedPost.id, { media: allMedia });

        // Update local state
        setLocalMedia(allMedia.map((m) => ({ ...m, isUploaded: true })));
        setEditedPost({ ...editedPost, media: allMedia });

        onPostUpdated?.({ ...editedPost, media: allMedia } as Post);
      }

      // Also save other fields
      await debouncedSave(editedPost);

      // Check if we should schedule the post
      // Conditions: status is "ready", has scheduled date at least 5 min in future, Instagram connected, has uploaded media
      const uploadedMedia = [...existingMedia, ...allMedia].filter(
        (m) => !isLocalBlobUrl(m.url)
      );
      const scheduledTime = editedPost.scheduledDate
        ? new Date(editedPost.scheduledDate)
        : null;
      const minScheduleTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
      const shouldSchedule =
        editedPost.status === "ready" && // Only schedule when status is "ready"
        scheduledTime &&
        scheduledTime.getTime() >= minScheduleTime &&
        hasInstagramConnected &&
        uploadedMedia.length > 0;

      if (shouldSchedule) {
        setUploadProgress("Scheduling post...");

        const response = await fetch("/api/instagram/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: editedPost.id,
            organizationId,
            scheduledDate: scheduledTime.toISOString(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to schedule post");
        }

        // Update local state
        const updatedPost = {
          ...editedPost,
          status: "ready" as PostStatus,
          scheduledDate: scheduledTime,
          media: allMedia,
        };
        setEditedPost(updatedPost);
        onPostUpdated?.(updatedPost as Post);

        toast.success(
          `Saved and scheduled for ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`
        );
      } else {
        toast.success("Post saved!");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save post"
      );
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
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
            <div className="p-4 border-b border-border">
              {/* Inline Settings Row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Platform Icons */}
                <div className="flex items-center gap-1">
                  {PLATFORMS.map((platform) => {
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

                {/* Scheduled Date */}
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      "schedule-input"
                    ) as HTMLInputElement;
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
                  min={(() => {
                    const minDate = new Date(Date.now() + 5 * 60 * 1000);
                    const year = minDate.getFullYear();
                    const month = String(minDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const day = String(minDate.getDate()).padStart(2, "0");
                    const hours = String(minDate.getHours()).padStart(2, "0");
                    const minutes = String(minDate.getMinutes()).padStart(
                      2,
                      "0"
                    );
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
                  value={(() => {
                    // Use scheduled date if set, otherwise default to 5 min from now
                    const d = editedPost.scheduledDate
                      ? new Date(editedPost.scheduledDate)
                      : new Date(Date.now() + 5 * 60 * 1000);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const hours = String(d.getHours()).padStart(2, "0");
                    const minutes = String(d.getMinutes()).padStart(2, "0");
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
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
                      onClick={handleSaveWithMedia}
                      disabled={isSaving || isPublishing}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {uploadProgress || "Saving..."}
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                    {/* Publish Button */}
                    {editedPost.status === "posted" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="gap-1.5"
                      >
                        <Instagram className="w-4 h-4" />
                        Published
                      </Button>
                    ) : hasInstagramConnected ? (
                      <Button
                        size="sm"
                        onClick={handlePublishToInstagram}
                        disabled={isSaving || isPublishing}
                        className="gap-1.5 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Publish
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/organization/${organizationId}/settings`
                          )
                        }
                        className="gap-1.5"
                      >
                        <Instagram className="w-4 h-4" />
                        Connect Instagram
                      </Button>
                    )}
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
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {uploadProgress || "Creating..."}
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
            <div className="flex-1 flex items-start justify-center">
              <InstagramPhonePreview
                media={localMedia}
                caption={editedPost.content}
                username={username}
                profileImage={profileImage || undefined}
                scale={0.6}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
