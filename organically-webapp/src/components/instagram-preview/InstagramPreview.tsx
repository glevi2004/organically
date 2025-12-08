"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostMedia } from "@/types/post";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Home,
  Users,
  Plus,
  Play,
  Inbox,
  User,
  Grid3X3,
  RotateCcw,
  BookmarkIcon,
} from "lucide-react";

// Preview modes
type PreviewMode = "feed" | "profile" | "web";

interface InstagramPreviewProps {
  media: PostMedia[];
  caption: string;
  username?: string;
  profileImage?: string;
  className?: string;
}

// Phone frame wrapper - compact size to fit in dialog
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[200px] h-[420px] bg-black rounded-[28px] p-2 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70px] h-[18px] bg-black rounded-b-xl z-20" />
      {/* Screen */}
      <div className="relative w-full h-full bg-white rounded-[22px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// Status bar - compact
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-3 py-0.5 text-[8px] text-black font-medium">
      <span>8:00</span>
      <div className="flex items-center gap-0.5">
        <div className="flex items-end gap-px">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[2px] bg-black rounded-sm"
              style={{ height: `${3 + i * 1.5}px` }}
            />
          ))}
        </div>
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 4h-3V2h-4v2H7v18h10V4z" />
        </svg>
      </div>
    </div>
  );
}

// Bottom navigation - compact
function BottomNav() {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-1.5 border-t border-gray-100 bg-white">
      <Home className="w-4 h-4" />
      <Users className="w-4 h-4" />
      <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center">
        <Plus className="w-3 h-3" />
      </div>
      <Inbox className="w-4 h-4" />
      <User className="w-4 h-4" />
    </div>
  );
}

// Feed View Component
function FeedView({
  media,
  caption,
  username,
  profileImage,
}: {
  media: PostMedia[];
  caption: string;
  username: string;
  profileImage?: string;
}) {
  const hasMedia = media.length > 0;
  const firstMedia = media[0];
  const isVideo = firstMedia?.type === "video";

  return (
    <div className="h-full flex flex-col bg-black">
      <StatusBar />
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-black">
        <span className="text-white text-[9px] font-medium opacity-60">
          Following
        </span>
        <span className="text-white text-[9px] font-semibold">For You</span>
        <svg
          className="w-3 h-3 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative flex-1 bg-black">
        {hasMedia ? (
          <>
            {isVideo ? (
              <video
                src={firstMedia.url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstMedia.url}
                alt="Post media"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Play indicator for video */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-500">
              <Plus className="w-8 h-8 mx-auto mb-1 opacity-30" />
              <p className="text-[9px]">Add media to preview</p>
            </div>
          </div>
        )}

        {/* Caption overlay at top */}
        {caption && (
          <div className="absolute top-2 left-2 right-10 z-10">
            <p className="text-white text-[9px] font-semibold drop-shadow-lg line-clamp-2">
              {caption}
            </p>
          </div>
        )}

        {/* Right side actions */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-2.5">
          {/* Profile */}
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500" />
              )}
            </div>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 border border-white flex items-center justify-center">
              <Plus className="w-2 h-2 text-white" />
            </div>
          </div>

          {/* Like */}
          <button className="flex flex-col items-center">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-white text-[7px] mt-0.5">...</span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center">
            <MessageCircle className="w-5 h-5 text-white scale-x-[-1]" />
            <span className="text-white text-[7px] mt-0.5">...</span>
          </button>

          {/* Bookmark */}
          <button>
            <Bookmark className="w-5 h-5 text-white" />
          </button>

          {/* Share */}
          <button>
            <Send className="w-5 h-5 text-white rotate-12" />
          </button>

          {/* Music */}
          <div className="w-5 h-5 rounded bg-gray-600 animate-pulse" />
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-2 left-2 right-10 z-10">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-white text-[9px] font-semibold">
              {username}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white text-[7px]">
            <span className="flex items-center gap-0.5">
              <Play className="w-2 h-2" />
              {username}
            </span>
            <span>Original sound</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Profile View Component
function ProfileView({
  media,
  username,
  profileImage,
}: {
  media: PostMedia[];
  username: string;
  profileImage?: string;
}) {
  // Create mock posts grid (current + placeholders)
  const mockPosts = [...media.slice(0, 1), ...Array(8).fill(null)];

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 py-1">
        <svg
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <MoreHorizontal className="w-4 h-4" />
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center py-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mb-1">
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImage}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500" />
          )}
        </div>
        <span className="text-[9px] font-semibold">{username}</span>
        {/* Placeholder stats */}
        <div className="flex items-center gap-2 mt-1.5 w-full justify-center">
          <div className="w-10 h-2.5 bg-gray-100 rounded" />
          <div className="w-10 h-2.5 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-y border-gray-100 py-1.5">
        <Grid3X3 className="w-3.5 h-3.5" />
        <RotateCcw className="w-3.5 h-3.5 text-gray-300" />
        <BookmarkIcon className="w-3.5 h-3.5 text-gray-300" />
      </div>

      {/* Posts grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-px">
          {mockPosts.map((post, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-100 relative overflow-hidden"
            >
              {post ? (
                <>
                  {post.type === "video" ? (
                    <video
                      src={post.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.url}
                      alt={`Post ${index}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* View count overlay */}
                  <div className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 text-white text-[6px]">
                    <Play className="w-2 h-2 fill-white" />
                    <span>1000</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Web/TV View Component
function WebTVView({
  media,
  caption,
  username,
}: {
  media: PostMedia[];
  caption: string;
  username: string;
}) {
  const hasMedia = media.length > 0;
  const firstMedia = media[0];

  return (
    <div className="h-full flex flex-col bg-gray-50 pt-4">
      {/* Main video area */}
      <div className="relative mx-auto w-[100px] aspect-9/16 bg-black rounded-lg overflow-hidden shadow-lg">
        {hasMedia ? (
          firstMedia.type === "video" ? (
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstMedia.url}
              alt="Post media"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Plus className="w-6 h-6 text-gray-600" />
          </div>
        )}

        {/* Caption overlay at top */}
        {caption && (
          <div className="absolute top-1.5 left-1.5 right-6 z-10">
            <p className="text-white text-[6px] font-semibold drop-shadow-lg line-clamp-2">
              {caption}
            </p>
          </div>
        )}

        {/* Right side mini actions */}
        <div className="absolute right-1 top-1/3 flex flex-col gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-500 border border-white" />
          <Heart className="w-3 h-3 text-white" />
          <MessageCircle className="w-3 h-3 text-white scale-x-[-1]" />
          <Bookmark className="w-3 h-3 text-white" />
          <Send className="w-3 h-3 text-white" />
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-1.5 left-1.5 right-4 z-10">
          <span className="text-white text-[6px] font-semibold">
            {username}
          </span>
        </div>
      </div>

      {/* Actions bar below */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 border rounded-lg">
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="text-[8px]">Edit</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 border rounded-lg">
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18V5l12-2v13M9 9l12-2" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-[8px]">Sounds</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 border rounded-lg">
          <span className="text-sm font-bold">Aa</span>
          <span className="text-[8px]">Text</span>
        </button>
      </div>
    </div>
  );
}

// Main component
export function InstagramPreview({
  media,
  caption,
  username = "username",
  profileImage,
  className,
}: InstagramPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("feed");

  return (
    <div className={cn("flex flex-col items-center p-4", className)}>
      {/* Mode tabs */}
      <div className="w-full flex items-center bg-muted/50 rounded-lg p-1 mb-3">
        {(["feed", "profile", "web"] as PreviewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              mode === m
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "feed" ? "Feed" : m === "profile" ? "Profile" : "Web/TV"}
          </button>
        ))}
      </div>

      {/* Phone mockup */}
      <PhoneFrame>
        {mode === "feed" && (
          <FeedView
            media={media}
            caption={caption}
            username={username}
            profileImage={profileImage}
          />
        )}
        {mode === "profile" && (
          <ProfileView
            media={media}
            username={username}
            profileImage={profileImage}
          />
        )}
        {mode === "web" && (
          <WebTVView media={media} caption={caption} username={username} />
        )}
      </PhoneFrame>
    </div>
  );
}
