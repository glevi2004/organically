"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PostModal } from "@/components/PostModal";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPostsByDateRange,
  updatePost,
  reorderPosts,
} from "@/services/postService";
import { Post, PostStatus } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";

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

// Helper to get platform icon
const getPlatformIcon = (platformId: string) => {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  return platform?.logo;
};

// Helper to get status colors
const getStatusColor = (status: string) => {
  const colors = {
    idea: "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300",
    draft:
      "bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
    ready:
      "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300",
    posted:
      "bg-purple-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300",
  };
  return colors[status as keyof typeof colors] || colors.idea;
};

// Get date key for grouping posts (YYYY-MM-DD format)
const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// Sortable Calendar Post Card Component
interface SortableCalendarPostCardProps {
  post: Post;
  onClick: () => void;
  isDragOverlay?: boolean;
}

function SortableCalendarPostCard({
  post,
  onClick,
  isDragOverlay = false,
}: SortableCalendarPostCardProps) {
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
        "p-1.5 rounded border text-xs group cursor-pointer",
        getStatusColor(post.status),
        isDragging && !isDragOverlay && "opacity-50",
        isDragOverlay && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-1">
        {/* Card Content - Clickable */}
        <div
          className="flex-1 flex items-center gap-1 min-w-0"
          onClick={onClick}
        >
          <div className="flex items-center gap-0.5 shrink-0">
            {post.platforms.map((platformId) => {
              const logo = getPlatformIcon(platformId);
              return logo ? (
                <Image
                  key={platformId}
                  src={logo}
                  alt={platformId}
                  width={12}
                  height={12}
                  className="shrink-0"
                />
              ) : null;
            })}
          </div>
          <span className="truncate font-medium">{post.title}</span>
        </div>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-current opacity-0 group-hover:opacity-70 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Post Card for Drag Overlay
function CalendarPostCardOverlay({ post }: { post: Post }) {
  return (
    <div
      className={cn(
        "p-1.5 rounded border text-xs shadow-lg ring-2 ring-primary",
        getStatusColor(post.status)
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 shrink-0">
          {post.platforms.map((platformId) => {
            const logo = getPlatformIcon(platformId);
            return logo ? (
              <Image
                key={platformId}
                src={logo}
                alt={platformId}
                width={12}
                height={12}
                className="shrink-0"
              />
            ) : null;
          })}
        </div>
        <span className="truncate font-medium">{post.title}</span>
        <GripVertical className="w-3 h-3 shrink-0 opacity-70" />
      </div>
    </div>
  );
}

// Calendar Day Component (Droppable)
interface CalendarDayProps {
  day: Date;
  posts: Post[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onPostClick: (post: Post) => void;
  isOver?: boolean;
}

function CalendarDay({
  day,
  posts,
  isCurrentMonth,
  isToday,
  onPostClick,
  isOver,
}: CalendarDayProps) {
  const dateKey = getDateKey(day);
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: dateKey,
  });

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [posts]
  );

  const showHighlight = isOver || isOverDroppable;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] p-2 border-r last:border-r-0 transition-colors",
        !isCurrentMonth && "bg-muted/30",
        isToday && "bg-blue-50 dark:bg-blue-950/20",
        showHighlight && "bg-primary/10"
      )}
    >
      <div
        className={cn(
          "text-sm font-medium mb-2",
          isToday &&
            "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
        )}
      >
        {day.getDate()}
      </div>

      <SortableContext
        items={sortedPosts.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {sortedPosts.map((post) => (
            <SortableCalendarPostCard
              key={post.id}
              post={post}
              onClick={() => onPostClick(post)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function CalendarPage() {
  const { activeOrganization } = useOrganization();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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

  // Get start and end of current month
  const getMonthRange = useCallback((date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }, []);

  const loadPosts = useCallback(async () => {
    if (!activeOrganization) return;

    try {
      setLoadingPosts(true);
      const { start, end } = getMonthRange(currentDate);
      const monthPosts = await getPostsByDateRange(
        activeOrganization.id,
        start,
        end
      );
      setPosts(monthPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  }, [activeOrganization, currentDate, getMonthRange]);

  // Load posts for current month
  useEffect(() => {
    if (activeOrganization) {
      loadPosts();
    }
  }, [activeOrganization, loadPosts]);

  // Open modal for creating new post
  const handleAddPost = () => {
    setSelectedPost(null);
    setShowModal(true);
  };

  // Handle post creation from modal
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [...prev, newPost]);
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

  // Get weeks in current month
  const getWeeksInMonth = () => {
    const { start } = getMonthRange(currentDate);
    const weeks: Date[] = [];
    let current = new Date(start);

    // Go back to the Monday of the week containing the 1st
    while (current.getDay() !== 1) {
      current.setDate(current.getDate() - 1);
    }

    // Generate 6 weeks to cover the month view
    for (let i = 0; i < 6; i++) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return weeks;
  };

  // Get days for a specific week
  const getDaysInWeek = (weekStart: Date) => {
    const days: Date[] = [];
    const current = new Date(weekStart);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Group posts by date key
  const postsByDate = useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    posts.forEach((post) => {
      if (post.scheduledDate) {
        const key = getDateKey(new Date(post.scheduledDate));
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(post);
      }
    });
    return grouped;
  }, [posts]);

  // Get the active post being dragged
  const activePost = useMemo(() => {
    if (!activeId) return null;
    return posts.find((p) => p.id === activeId) || null;
  }, [activeId, posts]);

  // Open post in modal for editing
  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    setShowModal(true);
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

    const draggedPost = posts.find((p) => p.id === activePostId);
    if (!draggedPost || !draggedPost.scheduledDate) return;

    // Check if dropped over a date cell or another post
    const isOverDateCell = overId.match(/^\d{4}-\d{2}-\d{2}$/);
    const overPost = posts.find((p) => p.id === overId);

    let targetDateKey: string;
    let targetIndex: number;

    if (isOverDateCell) {
      // Dropped on a date cell
      targetDateKey = overId;
      const targetPosts = postsByDate[targetDateKey] || [];
      targetIndex = targetPosts.length;
    } else if (overPost && overPost.scheduledDate) {
      // Dropped on another post
      targetDateKey = getDateKey(new Date(overPost.scheduledDate));
      const targetPosts = (postsByDate[targetDateKey] || []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      targetIndex = targetPosts.findIndex((p) => p.id === overId);
    } else {
      return;
    }

    const sourceDateKey = getDateKey(new Date(draggedPost.scheduledDate));

    // Parse target date
    const [year, month, day] = targetDateKey.split("-").map(Number);
    const targetDate = new Date(draggedPost.scheduledDate);
    targetDate.setFullYear(year, month - 1, day);

    // Check if date changed
    const dateChanged = sourceDateKey !== targetDateKey;

    // Check if position changed in same day
    const sourcePosts = (postsByDate[sourceDateKey] || []).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const sourceIndex = sourcePosts.findIndex((p) => p.id === activePostId);

    if (!dateChanged && sourceIndex === targetIndex) {
      return; // No change
    }

    // Optimistic update
    const newPosts = [...posts];

    if (dateChanged) {
      // Move to different day
      const postIndex = newPosts.findIndex((p) => p.id === activePostId);
      newPosts[postIndex] = {
        ...newPosts[postIndex],
        scheduledDate: targetDate,
        order: targetIndex,
      };

      // Update source day orders
      const sourceUpdates: Array<{
        id: string;
        order: number;
        status?: PostStatus;
      }> = [];
      sourcePosts
        .filter((p) => p.id !== activePostId)
        .forEach((post, index) => {
          const idx = newPosts.findIndex((p) => p.id === post.id);
          newPosts[idx] = { ...newPosts[idx], order: index };
          sourceUpdates.push({ id: post.id, order: index });
        });

      // Update target day orders
      const targetPosts = [
        ...(postsByDate[targetDateKey] || []).sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        ),
      ];
      targetPosts.splice(targetIndex, 0, {
        ...draggedPost,
        scheduledDate: targetDate,
      });

      const targetUpdates: Array<{
        id: string;
        order: number;
        status?: PostStatus;
      }> = [];
      targetPosts.forEach((post, index) => {
        const idx = newPosts.findIndex((p) => p.id === post.id);
        newPosts[idx] = { ...newPosts[idx], order: index };
        targetUpdates.push({ id: post.id, order: index });
      });

      setPosts(newPosts);

      try {
        // Update scheduled date
        await updatePost(activePostId, { scheduledDate: targetDate });
        // Update orders
        await reorderPosts([...sourceUpdates, ...targetUpdates]);
        toast.success("Post moved!");
      } catch (error) {
        console.error("Error moving post:", error);
        toast.error("Failed to move post");
        loadPosts();
      }
    } else {
      // Reorder within same day
      const dayPosts = [...sourcePosts];
      dayPosts.splice(sourceIndex, 1);
      dayPosts.splice(targetIndex, 0, draggedPost);

      const updates: Array<{ id: string; order: number; status?: PostStatus }> =
        [];
      dayPosts.forEach((post, index) => {
        const idx = newPosts.findIndex((p) => p.id === post.id);
        newPosts[idx] = { ...newPosts[idx], order: index };
        updates.push({ id: post.id, order: index });
      });

      setPosts(newPosts);

      try {
        await reorderPosts(updates);
      } catch (error) {
        console.error("Error reordering posts:", error);
        toast.error("Failed to reorder posts");
        loadPosts();
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Determine which date cell is being hovered
  const getOverDateKey = (): string | null => {
    if (!overId) return null;
    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return overId;
    }
    const overPost = posts.find((p) => p.id === overId);
    if (overPost?.scheduledDate) {
      return getDateKey(new Date(overPost.scheduledDate));
    }
    return null;
  };

  const overDateKey = getOverDateKey();

  const weeks = getWeeksInMonth();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">{monthName}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={handleAddPost}>
          <Plus className="w-4 h-4" />
          Add Post
        </Button>
      </div>

      {/* Post Modal (Create/Edit) */}
      <PostModal
        post={selectedPost}
        open={showModal}
        onOpenChange={setShowModal}
        onPostCreated={handlePostCreated}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        organizationId={activeOrganization?.id || ""}
        userId={user?.uid || ""}
      />

      {/* Calendar Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="border rounded-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            weeks.map((week, weekIndex) => {
              const days = getDaysInWeek(week);
              return (
                <div
                  key={weekIndex}
                  className="grid grid-cols-7 border-b last:border-b-0"
                >
                  {days.map((day, dayIndex) => {
                    const dateKey = getDateKey(day);
                    const dayPosts = postsByDate[dateKey] || [];
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isToday =
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();

                    return (
                      <CalendarDay
                        key={dayIndex}
                        day={day}
                        posts={dayPosts}
                        isCurrentMonth={isCurrentMonth}
                        isToday={isToday}
                        onPostClick={handleOpenPost}
                        isOver={overDateKey === dateKey && activeId !== null}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePost ? <CalendarPostCardOverlay post={activePost} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <span className="font-medium">Status:</span>
        {["idea", "draft", "ready", "posted"].map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded border ${getStatusColor(status)}`}
            />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
