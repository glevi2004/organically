"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PostModal } from "@/components/PostModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Calendar, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { getPostsByProfile, reorderPosts } from "@/services/postService";
import { Post, PostStatus } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/profile-constants";

// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

const statusOrder: PostStatus[] = ["idea", "draft", "ready", "posted"];

// Helper to get platform icon
const getPlatformIcon = (platformId: string) => {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  return platform?.logo;
};

// Helper to get status colors
const getStatusColor = (status: PostStatus) => {
  const colors = {
    idea: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    draft:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    ready: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    posted:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  };
  return colors[status];
};

// Sortable Post Card Component
interface SortablePostCardProps {
  post: Post;
  onClick: () => void;
  isDragOverlay?: boolean;
}

function SortablePostCard({
  post,
  onClick,
  isDragOverlay = false,
}: SortablePostCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 border rounded-lg bg-background group",
        isDragging && !isDragOverlay && "opacity-50",
        isDragOverlay && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Card Content - Clickable */}
        <div
          className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onClick}
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {post.platforms.map((platformId) => {
                const logo = getPlatformIcon(platformId);
                return logo ? (
                  <Image
                    key={platformId}
                    src={logo}
                    alt={platformId}
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                ) : null;
              })}
            </div>
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

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -mr-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Post Card for Drag Overlay (non-sortable version)
function PostCardOverlay({ post }: { post: Post }) {
  return (
    <div className="p-3 border rounded-lg bg-background shadow-lg ring-2 ring-primary">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {post.platforms.map((platformId) => {
                const logo = getPlatformIcon(platformId);
                return logo ? (
                  <Image
                    key={platformId}
                    src={logo}
                    alt={platformId}
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                ) : null;
              })}
            </div>
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
        <div className="mt-0.5 p-1 -mr-1 text-muted-foreground">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  status: PostStatus;
  posts: Post[];
  isLoading: boolean;
  onPostClick: (post: Post) => void;
  isOver?: boolean;
}

function KanbanColumn({
  status,
  posts,
  isLoading,
  onPostClick,
  isOver,
}: KanbanColumnProps) {
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: status,
  });

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => a.order - b.order),
    [posts]
  );

  const showHighlight = isOver || isOverDroppable;

  return (
    <Card className={cn("transition-colors", showHighlight && "bg-muted/50")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="capitalize">{status}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
              status
            )}`}
          >
            {posts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-2 min-h-[100px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No posts
          </p>
        ) : (
          <SortableContext
            items={sortedPosts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedPosts.map((post) => (
              <SortablePostCard
                key={post.id}
                post={post}
                onClick={() => onPostClick(post)}
              />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

export default function PostsPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  // Group posts by status
  const postsByStatus = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = posts.filter((p) => p.status === status);
      return acc;
    }, {} as Record<PostStatus, Post[]>);
  }, [posts]);

  // Get the active post being dragged
  const activePost = useMemo(() => {
    if (!activeId) return null;
    return posts.find((p) => p.id === activeId) || null;
  }, [activeId, posts]);

  const loadPosts = useCallback(async () => {
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
  }, [activeProfile]);

  // Load posts
  useEffect(() => {
    if (activeProfile) {
      loadPosts();
    }
  }, [activeProfile, loadPosts]);

  // Open post in modal for editing
  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  // Open modal for creating new post
  const handleAddPost = () => {
    setSelectedPost(null);
    setShowModal(true);
  };

  // Handle post creation from modal
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handle post update from modal
  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  // Handle post deletion from modal
  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activePostId = active.id as string;
    const overId = over.id as string;

    // Find the active post
    const activePost = posts.find((p) => p.id === activePostId);
    if (!activePost) return;

    // Check if dropped over a column (status) or another post
    const isOverColumn = statusOrder.includes(overId as PostStatus);
    const overPost = posts.find((p) => p.id === overId);

    let targetStatus: PostStatus;
    let targetIndex: number;

    if (isOverColumn) {
      // Dropped on empty column
      targetStatus = overId as PostStatus;
      const targetPosts = posts.filter((p) => p.status === targetStatus);
      targetIndex = targetPosts.length;
    } else if (overPost) {
      // Dropped on another post
      targetStatus = overPost.status;
      const targetPosts = posts
        .filter((p) => p.status === targetStatus)
        .sort((a, b) => a.order - b.order);
      targetIndex = targetPosts.findIndex((p) => p.id === overId);
    } else {
      return;
    }

    // Check if anything changed
    const isSameColumn = activePost.status === targetStatus;
    const sourcePosts = posts
      .filter((p) => p.status === activePost.status)
      .sort((a, b) => a.order - b.order);
    const sourceIndex = sourcePosts.findIndex((p) => p.id === activePostId);

    if (isSameColumn && sourceIndex === targetIndex) {
      return; // No change
    }

    // Optimistic update
    const newPosts = [...posts];

    if (isSameColumn) {
      // Reorder within same column
      const columnPosts = newPosts
        .filter((p) => p.status === targetStatus)
        .sort((a, b) => a.order - b.order);

      // Remove from old position
      columnPosts.splice(sourceIndex, 1);
      // Insert at new position
      columnPosts.splice(targetIndex, 0, { ...activePost });

      // Update orders
      const updates: Array<{ id: string; order: number; status?: PostStatus }> =
        [];
      columnPosts.forEach((post, index) => {
        const postIndex = newPosts.findIndex((p) => p.id === post.id);
        newPosts[postIndex] = { ...newPosts[postIndex], order: index };
        updates.push({ id: post.id, order: index });
      });

      setPosts(newPosts);

      try {
        await reorderPosts(updates);
      } catch (error) {
        console.error("Error reordering posts:", error);
        toast.error("Failed to reorder posts");
        loadPosts(); // Reload to restore correct state
      }
    } else {
      // Move to different column
      // Update source column orders
      const sourceColumnPosts = newPosts
        .filter((p) => p.status === activePost.status && p.id !== activePostId)
        .sort((a, b) => a.order - b.order);

      // Update target column orders
      const targetColumnPosts = newPosts
        .filter((p) => p.status === targetStatus)
        .sort((a, b) => a.order - b.order);

      // Insert at target position
      targetColumnPosts.splice(targetIndex, 0, {
        ...activePost,
        status: targetStatus,
      });

      // Calculate all updates
      const updates: Array<{ id: string; order: number; status?: PostStatus }> =
        [];

      // Update source column
      sourceColumnPosts.forEach((post, index) => {
        const postIndex = newPosts.findIndex((p) => p.id === post.id);
        newPosts[postIndex] = { ...newPosts[postIndex], order: index };
        updates.push({ id: post.id, order: index });
      });

      // Update target column
      targetColumnPosts.forEach((post, index) => {
        const postIndex = newPosts.findIndex((p) => p.id === post.id);
        if (post.id === activePostId) {
          newPosts[postIndex] = {
            ...newPosts[postIndex],
            status: targetStatus,
            order: index,
          };
          updates.push({ id: post.id, order: index, status: targetStatus });
        } else {
          newPosts[postIndex] = { ...newPosts[postIndex], order: index };
          updates.push({ id: post.id, order: index });
        }
      });

      setPosts(newPosts);

      try {
        await reorderPosts(updates);
        toast.success("Post moved!");
      } catch (error) {
        console.error("Error moving post:", error);
        toast.error("Failed to move post");
        loadPosts(); // Reload to restore correct state
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Determine which column is being hovered
  const getOverColumn = (): PostStatus | null => {
    if (!overId) return null;
    if (statusOrder.includes(overId as PostStatus)) {
      return overId as PostStatus;
    }
    const overPost = posts.find((p) => p.id === overId);
    return overPost?.status || null;
  };

  const overColumn = getOverColumn();

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
        <Button onClick={handleAddPost}>
          <Plus className="w-4 h-4" />
          Add Post
        </Button>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              posts={postsByStatus[status]}
              isLoading={loadingPosts}
              onPostClick={handleOpenPost}
              isOver={overColumn === status && activeId !== null}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePost ? <PostCardOverlay post={activePost} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Post Modal (Create/Edit) */}
      <PostModal
        post={selectedPost}
        open={showModal}
        onOpenChange={setShowModal}
        onPostCreated={handlePostCreated}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        profileId={activeProfile?.id || ""}
        userId={user?.uid || ""}
      />
    </div>
  );
}
