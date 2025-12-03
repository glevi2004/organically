"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPost, getPostsByDateRange } from "@/services/postService";
import { Post } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/profile-constants";

export default function CalendarPage() {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [scheduledDate, setScheduledDate] = useState("");

  // Get start and end of current month
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  // Load posts for current month
  useEffect(() => {
    if (activeProfile) {
      loadPosts();
    }
  }, [activeProfile, currentDate]);

  const loadPosts = async () => {
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
  };

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
        platform: platform as any,
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

  // Get posts for a specific day
  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => {
      if (!post.scheduledDate) return false;
      const postDate = new Date(post.scheduledDate);
      return (
        postDate.getDate() === day.getDate() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getFullYear() === day.getFullYear()
      );
    });
  };

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

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.logo;
  };

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
                setPlatform("instagram");
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

      {/* Calendar Grid */}
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
                  const dayPosts = getPostsForDay(day);
                  const isCurrentMonth =
                    day.getMonth() === currentDate.getMonth();
                  const isToday =
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[120px] p-2 border-r last:border-r-0 ${
                        isCurrentMonth ? "" : "bg-muted/30"
                      } ${isToday ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isToday
                            ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {day.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayPosts.map((post) => {
                          const platformLogo = getPlatformIcon(post.platform);
                          return (
                            <div
                              key={post.id}
                              className={`p-1.5 rounded border text-xs ${getStatusColor(
                                post.status
                              )}`}
                            >
                              <div className="flex items-center gap-1">
                                {platformLogo && (
                                  <Image
                                    src={platformLogo}
                                    alt={post.platform}
                                    width={12}
                                    height={12}
                                  />
                                )}
                                <span className="truncate font-medium">
                                  {post.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

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
