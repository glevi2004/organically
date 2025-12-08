"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { Loader2, CircleDot, Globe, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { getPost, updatePost, reorderPosts } from "@/services/postService";
import { Post, PostStatus, PostPlatform } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Status configuration with colors and grouping
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

// Helper to get platform icon
const getPlatformIcon = (platformId: string) => {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  return platform?.logo;
};

export default function PostEditPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const { setCustomTitle } = useBreadcrumb();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [editedPost, setEditedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Refs for debounced save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load the post
  useEffect(() => {
    if (postId) {
      loadPost();
    }

    // Clear custom title when leaving the page
    return () => setCustomTitle(null);
  }, [postId, setCustomTitle]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const fetchedPost = await getPost(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setEditedPost(fetchedPost);
        setCustomTitle(fetchedPost.content?.slice(0, 50) || "Post");
        // Initialize lastSaved ref to prevent unnecessary first save
        lastSavedRef.current = JSON.stringify({
          content: fetchedPost.content,
          scheduledDate: fetchedPost.scheduledDate?.getTime(),
        });
      } else {
        toast.error("Post not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Debounced save for content changes
  const debouncedSave = useCallback(async (postToSave: Post) => {
    // Clear any existing saved timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    // Create a snapshot to compare
    const snapshot = JSON.stringify({
      content: postToSave.content,
      scheduledDate: postToSave.scheduledDate?.getTime(),
    });

    // Skip if nothing changed since last save
    if (snapshot === lastSavedRef.current) {
      return;
    }

    try {
      setSaveStatus("saving");
      await updatePost(postToSave.id, {
        content: postToSave.content,
        scheduledDate: postToSave.scheduledDate,
      });
      lastSavedRef.current = snapshot;
      setPost(postToSave);
      setSaveStatus("saved");

      // Reset to idle after 2 seconds
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
      setSaveStatus("idle");
    }
  }, []);

  // Handle content change with debounce
  const handleContentChange = useCallback(
    (content: string) => {
      if (!editedPost) return;

      const updatedPost = { ...editedPost, content };
      setEditedPost(updatedPost);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save (1.5 second delay)
      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(updatedPost);
      }, 1500);
    },
    [editedPost, debouncedSave]
  );

  // Handle date blur save (immediate)
  const handleFieldSave = async () => {
    if (!editedPost || !post) return;

    // Only save if scheduledDate changed
    const dateChanged =
      post.scheduledDate?.getTime() !== editedPost.scheduledDate?.getTime();

    if (!dateChanged) return;

    // Clear any pending content save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await debouncedSave(editedPost);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const handleStatusChange = async (newStatus: PostStatus) => {
    if (!editedPost) return;

    try {
      await reorderPosts([
        { id: editedPost.id, order: editedPost.order, status: newStatus },
      ]);
      setEditedPost({ ...editedPost, status: newStatus });
      toast.success("Status updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!editedPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full space-y-2">
      {/* Properties */}
      <div className="space-y-3 py-4">
        {/* Status */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36 flex items-center gap-2">
            <CircleDot className="h-4 w-4" />
            Status
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-base ${
                  statusConfig[editedPost.status].bgColor
                } ${
                  statusConfig[editedPost.status].textColor
                } hover:opacity-80 transition-opacity cursor-pointer`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    statusConfig[editedPost.status].dotColor
                  }`}
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
                        className={`w-2.5 h-2.5 rounded-full ${statusConfig[status].dotColor}`}
                      />
                      <span
                        className={`px-2.5 py-1 rounded text-base ${statusConfig[status].bgColor} ${statusConfig[status].textColor}`}
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

        {/* Platforms */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Platforms
          </span>
          <div className="flex-1">
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
                {PLATFORMS.map((platform) => (
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
                      setEditedPost({ ...editedPost, platforms: newPlatforms });
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
        </div>

        {/* Scheduled Date */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
          </span>
          <Input
            type="datetime-local"
            value={
              editedPost.scheduledDate
                ? new Date(editedPost.scheduledDate).toISOString().slice(0, 16)
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
            className="w-auto border-none bg-transparent hover:bg-muted px-2 h-9"
          />
        </div>

        {/* Created Date */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Created
          </span>
          <span className="text-muted-foreground">
            {new Date(editedPost.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Content Editor */}
      <PostEditor
        content={editedPost.content}
        onChange={handleContentChange}
        saveStatus={saveStatus}
        placeholder="What's happening?"
      />
    </div>
  );
}
