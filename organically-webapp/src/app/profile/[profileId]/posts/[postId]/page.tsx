"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PostEditor } from "@/components/PostEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPost, updatePost, reorderPosts } from "@/services/postService";
import { Post, PostStatus } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/profile-constants";

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
  const { activeProfile } = useProfile();
  const { setCustomTitle } = useBreadcrumb();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [editedPost, setEditedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setCustomTitle(fetchedPost.title);
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

  // Check if post has changes
  const hasChanges = () => {
    if (!post || !editedPost) return false;
    return (
      post.title !== editedPost.title ||
      post.content !== editedPost.content ||
      post.scheduledDate?.getTime() !== editedPost.scheduledDate?.getTime()
    );
  };

  const handleSave = async () => {
    if (!editedPost || !hasChanges()) return;

    try {
      setSaving(true);
      await updatePost(editedPost.id, {
        title: editedPost.title,
        content: editedPost.content,
        scheduledDate: editedPost.scheduledDate,
      });
      setPost(editedPost);
      toast.success("Post saved!");
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

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

  const platformLogo = getPlatformIcon(editedPost.platform);

  return (
    <div className="mt-6 w-full space-y-2">
      {/* Title - Large editable heading */}
      <input
        type="text"
        value={editedPost.title}
        onChange={(e) => {
          setEditedPost({ ...editedPost, title: e.target.value });
          setCustomTitle(e.target.value);
        }}
        onBlur={handleSave}
        placeholder="Untitled"
        className="w-full text-3xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
      />

      {/* Properties */}
      <div className="space-y-3 py-4">
        {/* Status */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36">Status</span>
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

        {/* Platform */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36">Platform</span>
          <div className="flex items-center gap-2">
            {platformLogo && (
              <Image
                src={platformLogo}
                alt={editedPost.platform}
                width={20}
                height={20}
              />
            )}
            <span className="capitalize">{editedPost.platform}</span>
          </div>
        </div>

        {/* Scheduled Date */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36">Scheduled</span>
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
            onBlur={handleSave}
            className="w-auto border-none bg-transparent hover:bg-muted px-2 h-9"
          />
        </div>

        {/* Created Date */}
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-36">Created</span>
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
        onChange={(content) => setEditedPost({ ...editedPost, content })}
        onBlur={handleSave}
        placeholder="What's happening?"
      />
    </div>
  );
}
