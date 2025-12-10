"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import {
  MessageCircle,
  MessageSquare,
  Zap,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { TriggerNodeData, TriggerType } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

// Icon and color configuration for each trigger type
const triggerConfig: Record<
  TriggerType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  direct_message: {
    icon: MessageCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  post_comment: {
    icon: MessageSquare,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
};

interface TriggerNodeProps {
  id: string;
  data: TriggerNodeData;
  selected?: boolean;
}

interface InstagramPost {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export const TriggerNode = memo(({ id, data, selected }: TriggerNodeProps) => {
  const { setNodes } = useReactFlow();
  const { activeOrganization } = useOrganization();

  const channels =
    activeOrganization?.channels?.filter((c) => c.isActive) || [];

  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const config = triggerConfig[data.type] || {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  };
  const Icon = config.icon;

  // Fetch posts when channel is selected and trigger type is post_comment
  useEffect(() => {
    const fetchPosts = async () => {
      if (data.type !== "post_comment" || !data.channelId) {
        setPosts([]);
        setPostsError(null);
        return;
      }

      setLoadingPosts(true);
      setPostsError(null);

      try {
        const response = await fetch(
          `/api/instagram/posts?channelId=${data.channelId}&limit=25`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch posts");
        }

        const result = await response.json();
        setPosts(result.data || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPostsError(
          error instanceof Error ? error.message : "Failed to fetch posts"
        );
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [data.channelId, data.type]);

  // Update node data
  const updateData = useCallback(
    (updates: Partial<TriggerNodeData>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    [id, setNodes]
  );

  // Handle keyword input
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const keyword = input.value.trim();
      if (keyword && !data.keywords?.includes(keyword)) {
        updateData({ keywords: [...(data.keywords || []), keyword] });
        input.value = "";
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    updateData({ keywords: data.keywords?.filter((k) => k !== keyword) || [] });
  };

  // Search state for posts
  const [postSearch, setPostSearch] = useState("");

  // Handle post selection
  const handlePostToggle = (postId: string) => {
    const currentPostIds = data.postIds || [];
    const isSelected = currentPostIds.includes(postId);

    if (isSelected) {
      // Remove post from selection
      const newPostIds = currentPostIds.filter((id) => id !== postId);
      updateData({ postIds: newPostIds });
    } else {
      // Add post to selection
      updateData({ postIds: [...currentPostIds, postId] });
    }
  };

  const selectedPostIds = data.postIds || [];
  const selectedCount = selectedPostIds.length;

  // Filter posts based on search
  const filteredPosts = posts.filter((post) =>
    (post.caption || "").toLowerCase().includes(postSearch.toLowerCase())
  );

  // Truncate caption for display
  const truncateCaption = (caption: string, maxLength: number = 50) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={cn(
        "w-72 rounded-xl border-2 bg-card shadow-xl overflow-hidden",
        "transition-all duration-200",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{data.label}</h3>
          <p className="text-[10px] text-muted-foreground">Trigger</p>
        </div>
      </div>

      {/* Body - Configuration */}
      <div className="p-4 space-y-4">
        {/* Channel Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Channel</Label>
          <Select
            value={data.channelId || ""}
            onValueChange={(value) => {
              updateData({ channelId: value, postIds: [] }); // Reset post selection when channel changes
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select a channel..." />
            </SelectTrigger>
            <SelectContent>
              {channels.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No channels connected
                </div>
              ) : (
                channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={channel.profileImageUrl || undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {channel.accountName?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>@{channel.accountName}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Post Selection - Only for post_comment trigger */}
        {data.type === "post_comment" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Posts</Label>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCount} selected
                </Badge>
              )}
            </div>

            {!data.channelId ? (
              <p className="text-xs text-muted-foreground py-2">
                Select a channel first
              </p>
            ) : loadingPosts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : postsError ? (
              <p className="text-xs text-destructive py-2">{postsError}</p>
            ) : posts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No posts found for this channel
              </p>
            ) : (
              <div className="space-y-2">
                {/* Search Input */}
                <Input
                  placeholder="Search posts..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="h-8 text-xs"
                />

                {/* Posts List */}
                <div
                  className="max-h-[180px] overflow-y-auto border rounded-md p-2 space-y-1 nowheel"
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  {filteredPosts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No posts match your search
                    </p>
                  ) : (
                    filteredPosts.map((post) => {
                      const isSelected = selectedPostIds.includes(post.id);
                      return (
                        <div
                          key={post.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                          onClick={() => handlePostToggle(post.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handlePostToggle(post.id)}
                            id={`post-${post.id}`}
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          />
                          {post.thumbnail_url && (
                            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                              <Image
                                src={post.thumbnail_url}
                                alt="Post thumbnail"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <label
                            htmlFor={`post-${post.id}`}
                            className="text-xs cursor-pointer flex-1 min-w-0"
                          >
                            <div className="truncate">
                              {post.caption
                                ? truncateCaption(post.caption, 40)
                                : "Untitled post"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Keywords</Label>
          <div className="relative">
            <Input
              placeholder="Type keyword and press Enter..."
              className="h-9 text-sm pr-8"
              onKeyDown={handleKeywordKeyDown}
            />
            <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {data.keywords && data.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-0.5 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Match Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Match Type</Label>
          <Select
            value={data.matchType || "contains"}
            onValueChange={(value: "exact" | "contains" | "starts_with") =>
              updateData({ matchType: value })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="exact">Exact Match</SelectItem>
              <SelectItem value="starts_with">Starts With</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3! h-3! bg-primary! border-2! border-background!"
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
