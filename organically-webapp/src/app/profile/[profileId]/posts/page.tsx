"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/animate-ui/components/radix/sheet";
import { Plus, Loader2, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  createPost,
  getPostsByProfile,
  updatePost,
  deletePost,
  updatePostStatus,
} from "@/services/postService";
import { Post, PostStatus } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/profile-constants";

export default function PostsPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add post dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [scheduledDate, setScheduledDate] = useState(() => {
    // Default to today at current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Load posts
  useEffect(() => {
    if (activeProfile) {
      loadPosts();
    }
  }, [activeProfile]);

  const loadPosts = async () => {
    if (!activeProfile) return;

    try {
      setLoadingPosts(true);
      const allPosts = await getPostsByProfile(activeProfile.id);
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleOpenDrawer = (post: Post) => {
    setSelectedPost(post);
    setIsDrawerOpen(true);
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;

    try {
      await updatePost(selectedPost.id, {
        title: selectedPost.title,
        content: selectedPost.content,
        notes: selectedPost.notes,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPost.id ? selectedPost : p))
      );

      toast.success("Post saved!");
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleStatusChange = async (postId: string, newStatus: PostStatus) => {
    try {
      await updatePostStatus(postId, newStatus);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
      );
      toast.success("Status updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) {
        setIsDrawerOpen(false);
      }
      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleAddPost = async () => {
    if (!title.trim() || !content.trim() || !activeProfile || !user) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      setSaving(true);
      const newPost = await createPost({
        profileId: activeProfile.id,
        userId: user.uid,
        title: title.trim(),
        content: content.trim(),
        platform: platform as any,
        status: "idea",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      });
      setPosts((prev) => [newPost, ...prev]);
      toast.success("Post added!");
      setShowAddDialog(false);

      // Reset form
      setTitle("");
      setContent("");
      setPlatform("instagram");
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setScheduledDate(now.toISOString().slice(0, 16));
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error("Failed to add post");
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.logo;
  };

  const getStatusColor = (status: PostStatus) => {
    const colors = {
      idea: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      draft:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      ready:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      posted:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    };
    return colors[status];
  };

  const statusOrder: PostStatus[] = ["idea", "draft", "ready", "posted"];

  const postsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = posts.filter((p) => p.status === status);
    return acc;
  }, {} as Record<PostStatus, Post[]>);

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
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Post
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusOrder.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    status
                  )}`}
                >
                  {postsByStatus[status].length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : postsByStatus[status].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No posts
                </p>
              ) : (
                postsByStatus[status].map((post) => {
                  const platformLogo = getPlatformIcon(post.platform);
                  return (
                    <div
                      key={post.id}
                      className="p-3 border rounded-lg bg-background cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleOpenDrawer(post)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {platformLogo && (
                          <Image
                            src={platformLogo}
                            alt={post.platform}
                            width={16}
                            height={16}
                            className="shrink-0 mt-0.5"
                          />
                        )}
                        <p className="text-sm font-medium line-clamp-2 flex-1">
                          {post.title}
                        </p>
                      </div>
                      {post.scheduledDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.scheduledDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Post Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Post</DialogTitle>
            <DialogDescription>Create a new content post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Morning Routine Tips"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your post content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={saving}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={saving}
                className="w-full p-2 border rounded-md bg-background"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Scheduled Date</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setTitle("");
                setContent("");
                setPlatform("instagram");
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                setScheduledDate(now.toISOString().slice(0, 16));
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPost} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Post"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedPost && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Post</SheetTitle>
                <SheetDescription>
                  Edit your post content and details
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Platform & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                      {getPlatformIcon(selectedPost.platform) && (
                        <Image
                          src={getPlatformIcon(selectedPost.platform)!}
                          alt={selectedPost.platform}
                          width={20}
                          height={20}
                        />
                      )}
                      <span className="capitalize font-medium">
                        {selectedPost.platform}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={selectedPost.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as PostStatus;
                        handleStatusChange(selectedPost.id, newStatus);
                        setSelectedPost({ ...selectedPost, status: newStatus });
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
                    value={selectedPost.title}
                    onChange={(e) =>
                      setSelectedPost({
                        ...selectedPost,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Caption / Content</Label>
                  <textarea
                    value={selectedPost.content}
                    onChange={(e) =>
                      setSelectedPost({
                        ...selectedPost,
                        content: e.target.value,
                      })
                    }
                    rows={10}
                    className="w-full p-2 border rounded-md bg-background resize-none"
                    placeholder="Write your post content..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedPost.content.length} characters
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (Private)</Label>
                  <textarea
                    value={selectedPost.notes || ""}
                    onChange={(e) =>
                      setSelectedPost({
                        ...selectedPost,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full p-2 border rounded-md bg-background resize-none"
                    placeholder="Add private notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSavePost} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    variant="outline"
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
