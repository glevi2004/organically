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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CircleDot,
  Globe,
  Calendar,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPost,
  updatePost,
  reorderPosts,
  deletePost,
} from "@/services/postService";
import { Post, PostStatus, PostType, PostPlatform } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";
import { POST_TYPES, getAllowedPlatformsForType } from "@/lib/post-constants";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  const isEditMode = !!post;
  const [editedPost, setEditedPost] = useState<
    Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string }
  >(getDefaultPost());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<"preview" | "settings">(
    "settings"
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Initialize edited post when post changes or modal opens
  useEffect(() => {
    if (open) {
      if (post) {
        setEditedPost(post);
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
        lastSavedRef.current = "";
      }
    }
  }, [post, open, organizationId, userId]);

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

  if (!editedPost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[90vw] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{isEditMode ? "Edit Post" : "Create Post"}</DialogTitle>
        </VisuallyHidden>
        <div className="grid grid-cols-[1fr_320px] min-h-[500px] max-h-[85vh]">
          {/* Left Side - Content Editor */}
          <div className="flex flex-col border-r border-border">
            {/* Header with Platform Icons */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold mb-3">Create Post</h3>
              <div className="flex items-center gap-2">
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
                        "relative p-2 rounded-full transition-all",
                        isSelected
                          ? "bg-muted ring-2 ring-primary"
                          : "bg-muted/50 hover:bg-muted opacity-50"
                      )}
                    >
                      <Image
                        src={platform.logo}
                        alt={platform.name}
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                    </button>
                  );
                })}
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

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-2">
                <ImagePlus className="w-4 h-4" />
                Insert Media
              </Button>
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

          {/* Right Side - Settings */}
          <div className="flex flex-col min-w-0">
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "preview" | "settings")}
              className="flex flex-col h-full"
            >
              <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12">
                <TabsTrigger
                  value="preview"
                  className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                >
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="preview"
                className="flex-1 p-4 m-0 overflow-y-auto"
              >
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Preview how your post will look on each platform.
                  </p>
                  {editedPost.platforms.map((platformId) => {
                    const platform = PLATFORMS.find((p) => p.id === platformId);
                    return (
                      <div
                        key={platformId}
                        className="p-3 rounded-lg bg-muted border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {platform?.logo && (
                            <Image
                              src={platform.logo}
                              alt={platform.name}
                              width={16}
                              height={16}
                            />
                          )}
                          <span className="text-sm font-medium">
                            {platform?.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {editedPost.content || "No content yet..."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent
                value="settings"
                className="flex-1 p-4 m-0 overflow-y-auto"
              >
                <div className="space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Title
                    </label>
                    <Input
                      value={editedPost.title}
                      onChange={(e) =>
                        setEditedPost({ ...editedPost, title: e.target.value })
                      }
                      onBlur={handleFieldSave}
                      placeholder="Post title..."
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <CircleDot className="h-4 w-4" />
                      Status
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                            statusConfig[editedPost.status].bgColor,
                            statusConfig[editedPost.status].textColor,
                            "hover:opacity-80 transition-opacity cursor-pointer"
                          )}
                        >
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full",
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
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <CircleDot className="h-4 w-4" />
                      Type
                    </label>
                    <select
                      value={editedPost.type || ""}
                      onChange={(e) => {
                        const newType = e.target.value as PostType | "";
                        const updatedPost = {
                          ...editedPost,
                          type: newType || undefined,
                        };
                        if (newType) {
                          const newAllowedPlatforms =
                            getAllowedPlatformsForType(newType as PostType);
                          updatedPost.platforms = editedPost.platforms.filter(
                            (p) => newAllowedPlatforms.includes(p)
                          );
                          if (
                            updatedPost.platforms.length === 0 &&
                            newAllowedPlatforms.length > 0
                          ) {
                            updatedPost.platforms = [newAllowedPlatforms[0]];
                          }
                        }
                        setEditedPost(updatedPost);
                      }}
                      onBlur={handleFieldSave}
                      className="w-full px-3 py-2 rounded-md text-sm bg-background border border-input"
                    >
                      <option value="">None</option>
                      {POST_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Platforms */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Platforms
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start min-h-[40px] h-auto"
                        >
                          {editedPost.platforms.length === 0 ? (
                            <span className="text-muted-foreground">
                              Select platforms...
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {editedPost.platforms.map((platformId) => {
                                const platform = PLATFORMS.find(
                                  (p) => p.id === platformId
                                );
                                return (
                                  <Badge
                                    key={platformId}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {platform?.logo && (
                                      <Image
                                        src={platform.logo}
                                        alt={platform.name}
                                        width={12}
                                        height={12}
                                      />
                                    )}
                                    {platform?.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        {PLATFORMS.filter((p) =>
                          getAllowedPlatformsForType(editedPost.type).includes(
                            p.id as PostPlatform
                          )
                        ).map((platform) => (
                          <DropdownMenuCheckboxItem
                            key={platform.id}
                            checked={editedPost.platforms.includes(
                              platform.id as PostPlatform
                            )}
                            onCheckedChange={(checked) => {
                              let newPlatforms: PostPlatform[];
                              if (checked) {
                                newPlatforms = [
                                  ...editedPost.platforms,
                                  platform.id as PostPlatform,
                                ];
                              } else {
                                newPlatforms = editedPost.platforms.filter(
                                  (p) => p !== platform.id
                                );
                              }
                              setEditedPost({
                                ...editedPost,
                                platforms: newPlatforms,
                              });
                            }}
                            onSelect={(e) => e.preventDefault()}
                          >
                            <div className="flex items-center gap-2">
                              {platform.logo && (
                                <Image
                                  src={platform.logo}
                                  alt={platform.name}
                                  width={16}
                                  height={16}
                                />
                              )}
                              {platform.name}
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Scheduled Date */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Scheduled
                    </label>
                    <Input
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
                    />
                  </div>

                  {/* Delete Button - Only in edit mode */}
                  {isEditMode && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete Post
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
