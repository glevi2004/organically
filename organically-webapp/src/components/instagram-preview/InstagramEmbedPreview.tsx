"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PostMedia } from "@/types/post";
import { ChevronLeft, ChevronRight, MoreHorizontal, Play } from "lucide-react";

interface InstagramEmbedPreviewProps {
  media: PostMedia[];
  caption: string;
  username?: string;
  profileImage?: string;
  location?: string;
  captioned?: boolean;
  width?: number | string;
  className?: string;
}

// Instagram's official icon components (matching their SVGs exactly)
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Like"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Comment"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <path
        d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Share"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <line
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="22"
        x2="9.218"
        y1="3"
        y2="10.083"
      />
      <polygon
        fill="none"
        points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Save"
      className={className}
      fill="currentColor"
      height="24"
      role="img"
      viewBox="0 0 24 24"
      width="24"
    >
      <polygon
        fill="none"
        points="20 21 12 13.44 4 21 4 3 20 3 20 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// Carousel navigation dots
function CarouselDots({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 py-2 bg-white dark:bg-zinc-900">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "w-[6px] h-[6px] rounded-full transition-colors",
            index === current ? "bg-[#0095f6]" : "bg-zinc-300 dark:bg-zinc-600"
          )}
        />
      ))}
    </div>
  );
}

// Media carousel component
function MediaCarousel({
  media,
  currentIndex,
  onIndexChange,
}: {
  media: PostMedia[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const handlePrev = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  if (media.length === 0) {
    return (
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <div className="text-center text-zinc-400 dark:text-zinc-500">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path
                d="M21 15l-5-5L5 21"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm">Add photos or videos</p>
        </div>
      </div>
    );
  }

  const currentMedia = media[currentIndex];

  return (
    <div className="relative aspect-square bg-black overflow-hidden">
      {/* Media */}
      {currentMedia.type === "video" ? (
        <video
          src={currentMedia.url}
          className="w-full h-full object-contain bg-black"
          controls={false}
          muted
          loop
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentMedia.url}
          alt="Post media"
          className="w-full h-full object-contain bg-black"
        />
      )}

      {/* Play button for video */}
      {currentMedia.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            </button>
          )}
          {currentIndex < media.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            </button>
          )}
        </>
      )}

      {/* Carousel indicator (top right) */}
      {media.length > 1 && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {currentIndex + 1}/{media.length}
        </div>
      )}
    </div>
  );
}

export function InstagramEmbedPreview({
  media,
  caption,
  username = "username",
  profileImage,
  location,
  captioned = true,
  width = 400,
  className,
}: InstagramEmbedPreviewProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset index when media changes
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [media.length]);

  // Parse caption for hashtags and mentions
  const renderCaption = (text: string) => {
    if (!text) return null;

    // Split by hashtags and mentions while keeping them
    const parts = text.split(/(#\w+|@\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("#") || part.startsWith("@")) {
        return (
          <span key={index} className="text-[#0095f6] dark:text-[#4cb5f9]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Truncate caption
  const maxLength = 125;
  const shouldTruncate = caption.length > maxLength && !isExpanded;
  const displayCaption = shouldTruncate
    ? caption.slice(0, maxLength).trim()
    : caption;

  return (
    <div
      className={cn("instagram-embed-preview", className)}
      style={{
        width: typeof width === "number" ? width : width,
        maxWidth: 540,
        minWidth: 326,
      }}
    >
      {/* Container with Instagram embed styling - responsive to dark/light */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3px] shadow-[0_0_1px_0_rgba(0,0,0,0.5),0_1px_10px_0_rgba(0,0,0,0.15)] dark:shadow-[0_0_1px_0_rgba(255,255,255,0.1),0_1px_10px_0_rgba(0,0,0,0.5)] m-px w-[calc(100%-2px)]">
        {/* Header */}
        <div className="flex items-center p-[14px_16px] border-b border-zinc-200 dark:border-zinc-700">
          {/* Profile picture with gradient ring */}
          <div
            className="w-8 h-8 rounded-full overflow-hidden mr-3 p-[2px]"
            style={{
              background:
                "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-zinc-900">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Username and location */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-[18px] font-sans">
              {username}
            </div>
            {location && (
              <div className="text-xs text-zinc-900 dark:text-zinc-100 leading-4 font-sans">
                {location}
              </div>
            )}
          </div>

          {/* More button */}
          <button className="text-zinc-900 dark:text-zinc-100 p-2 -m-2 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <MediaCarousel
          media={media}
          currentIndex={currentMediaIndex}
          onIndexChange={setCurrentMediaIndex}
        />

        {/* Carousel dots */}
        {media.length > 1 && (
          <CarouselDots
            total={media.length}
            current={currentMediaIndex}
            onSelect={setCurrentMediaIndex}
          />
        )}

        {/* Action buttons */}
        <div className="flex justify-between p-[8px_16px] bg-white dark:bg-zinc-900">
          <div className="flex gap-4">
            <button className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
              <HeartIcon />
            </button>
            <button className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
              <CommentIcon />
            </button>
            <button className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
              <ShareIcon />
            </button>
          </div>
          <button className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
            <BookmarkIcon />
          </button>
        </div>

        {/* Likes placeholder */}
        <div className="px-4 pb-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100 font-sans bg-white dark:bg-zinc-900">
          0 likes
        </div>

        {/* Caption */}
        {captioned && caption && (
          <div className="px-4 pb-2 text-sm text-zinc-900 dark:text-zinc-100 leading-[18px] font-sans bg-white dark:bg-zinc-900">
            <span className="font-semibold">{username}</span>{" "}
            <span className="whitespace-pre-wrap">
              {renderCaption(displayCaption)}
            </span>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-zinc-400 dark:text-zinc-500 bg-transparent border-none cursor-pointer text-sm p-0 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                ... more
              </button>
            )}
          </div>
        )}

        {/* View all comments placeholder */}
        <div className="px-4 pb-2 text-sm text-zinc-400 dark:text-zinc-500 font-sans bg-white dark:bg-zinc-900">
          View all 0 comments
        </div>

        {/* Add a comment placeholder */}
        <div className="px-4 pb-2 text-sm text-zinc-400 dark:text-zinc-500 font-sans bg-white dark:bg-zinc-900">
          Add a comment...
        </div>

        {/* Timestamp */}
        <div className="px-4 pb-3 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2px] font-sans bg-white dark:bg-zinc-900">
          Just now
        </div>
      </div>
    </div>
  );
}
