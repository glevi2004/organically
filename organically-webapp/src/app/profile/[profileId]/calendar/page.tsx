"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  createPost,
  getPostsByDateRange,
  updatePost,
  reorderPosts,
} from "@/services/postService";
import { Post, PostStatus, PostPlatform } from "@/types/post";
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
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [scheduledDate, setScheduledDate] = useState("");

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
    if (!activeProfile) return;

    try {
      setLoadingPosts(true);
      const { start, end } = getMonthRange(currentDate);
      const monthPosts = await getPostsByDateRange(
        activeProfile.id,
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
  }, [activeProfile, currentDate, getMonthRange]);

  // Load posts for current month
  useEffect(() => {
    if (activeProfile) {
      loadPosts();
    }
  }, [activeProfile, loadPosts]);

  const handleAddPost = async () => {
    if (
      !title.trim() ||
      !content.trim() ||
      !scheduledDate ||
      !activeProfile ||
      !user
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const post = await createPost({
        profileId: activeProfile.id,
        userId: user.uid,
        title: title.trim(),
        content: content.trim(),
        platforms: [platform],
        status: "draft",
        scheduledDate: new Date(scheduledDate),
      });

      setPosts((prev) => [...prev, post]);
      toast.success("Post added!");
      setShowAddDialog(false);

      // Reset form
      setTitle("");
      setContent("");
      setPlatform("instagram");
      setScheduledDate("");
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error("Failed to add post");
    } finally {
      setSaving(false);
    }
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

  // Navigate to post edit page
  const handleOpenPost = (post: Post) => {
    router.push(`/profile/${activeProfile?.id}/posts/${post.id}`);
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

        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Post
        </Button>
      </div>

      {/* Add Post Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Post</DialogTitle>
            <DialogDescription>
              Create a new content post for your calendar.
            </DialogDescription>
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
                onChange={(e) => setPlatform(e.target.value as PostPlatform)}
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
              <Label htmlFor="scheduled-date">Scheduled Date *</Label>
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
                setPlatform("instagram" as PostPlatform);
                setScheduledDate("");
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
