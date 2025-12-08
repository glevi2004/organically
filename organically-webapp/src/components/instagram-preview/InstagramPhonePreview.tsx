"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { PostMedia } from "@/types/post";
import { IPhoneFrame } from "./IPhoneFrame";
import { InstagramEmbedPreview } from "./InstagramEmbedPreview";
import {
  Grid3X3,
  Play,
  Pause,
  Bookmark,
  Film,
  UserCircle,
  Home,
  Search,
  PlusSquare,
  User,
  ArrowLeft,
  Copy,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Volume2,
  VolumeX,
} from "lucide-react";

// Instagram header component for Feed view
function InstagramFeedHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900">
      <button className="text-zinc-900 dark:text-zinc-100">
        <PlusSquare className="w-6 h-6" />
      </button>
      <button className="text-zinc-900 dark:text-zinc-100">
        <Heart className="w-6 h-6" />
      </button>
    </div>
  );
}

// Instagram header component for Profile view
function InstagramProfileHeader({ username }: { username: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900">
      <div className="flex items-center gap-1">
        <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
          {username}
        </span>
        <svg
          className="w-4 h-4 text-zinc-900 dark:text-zinc-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className="flex items-center gap-5">
        <button className="text-zinc-900 dark:text-zinc-100">
          <PlusSquare className="w-6 h-6" />
        </button>
        <button className="text-zinc-900 dark:text-zinc-100">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

type PreviewMode = "crop" | "feed" | "profile";

type AspectRatio = "original" | "1:1" | "9:16" | "16:9";

const ASPECT_RATIOS: { id: AspectRatio; label: string; ratio?: number }[] = [
  { id: "original", label: "Original" },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

interface InstagramPhonePreviewProps {
  media: PostMedia[];
  caption: string;
  username?: string;
  profileImage?: string;
  className?: string;
  scale?: number;
}

// Aspect ratio icon component
function AspectRatioIcon({
  ratio,
  className,
}: {
  ratio: AspectRatio;
  className?: string;
}) {
  const getPath = () => {
    switch (ratio) {
      case "original":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8" cy="10" r="1.5" fill="currentColor" />
            <path
              d="M21 15l-5-4-4 4-3-2-6 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "1:1":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        );
      case "9:16":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="6" y="2" width="12" height="20" rx="2" />
          </svg>
        );
      case "16:9":
        return (
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
          </svg>
        );
    }
  };
  return getPath();
}

// Crop View Component
function CropView({
  media,
  currentIndex,
  onIndexChange,
  aspectRatio,
  onAspectRatioChange,
}: {
  media: PostMedia[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
}) {
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const currentMedia = media[currentIndex];

  // Get aspect ratio style
  const getAspectStyle = () => {
    const ratioConfig = ASPECT_RATIOS.find((r) => r.id === aspectRatio);
    if (!ratioConfig?.ratio) return { aspectRatio: "auto" };
    return { aspectRatio: ratioConfig.ratio.toString() };
  };

  // Handle video play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setShowControls(true);
    } else {
      videoRef.current.play();
      setTimeout(() => setShowControls(false), 2000);
    }
    setIsPlaying(!isPlaying);
  };

  // Handle mute/unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (isPlaying) {
      setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900">
        <button className="text-zinc-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-zinc-900 dark:text-white font-semibold text-base">
          Crop
        </span>
        <button className="text-[#0095f6] font-semibold text-base">Next</button>
      </div>

      {/* Media Preview Area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden bg-zinc-100 dark:bg-zinc-900"
        onMouseMove={
          currentMedia?.type === "video" ? handleMouseMove : undefined
        }
      >
        {media.length === 0 ? (
          <div className="text-zinc-400 dark:text-zinc-500 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No media selected</p>
          </div>
        ) : currentMedia ? (
          <div
            className="relative max-w-full max-h-full overflow-hidden"
            style={getAspectStyle()}
          >
            {currentMedia.type === "video" ? (
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="w-full h-full object-cover cursor-pointer"
                muted={isMuted}
                loop
                playsInline
                onClick={togglePlay}
                onEnded={() => setIsPlaying(false)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentMedia.url}
                alt="Crop preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : null}

        {/* Video Play/Pause button overlay */}
        {currentMedia?.type === "video" && showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 hover:scale-105 transition-all duration-200 pointer-events-auto cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white fill-white pointer-events-none" />
              ) : (
                <Play className="w-8 h-8 text-white fill-white ml-1 pointer-events-none" />
              )}
            </button>
          </div>
        )}

        {/* Video Mute/Unmute button */}
        {currentMedia?.type === "video" && showControls && (
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all duration-200 z-10 cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white pointer-events-none" />
            ) : (
              <Volume2 className="w-4 h-4 text-white pointer-events-none" />
            )}
          </button>
        )}

        {/* Navigation arrows for multiple media */}
        {media.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={() => onIndexChange(currentIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 dark:bg-white/20 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            {currentIndex < media.length - 1 && (
              <button
                onClick={() => onIndexChange(currentIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 dark:bg-white/20 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-3 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between relative">
        {/* Aspect Ratio Button */}
        <div className="relative">
          <button
            onClick={() => setShowAspectMenu(!showAspectMenu)}
            className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-900 dark:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Aspect Ratio Menu */}
          {showAspectMenu && (
            <div className="absolute bottom-14 left-0 bg-white dark:bg-zinc-800/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl min-w-[160px] border border-zinc-200 dark:border-zinc-700">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => {
                    onAspectRatioChange(ratio.id);
                    setShowAspectMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors",
                    aspectRatio === ratio.id &&
                      "bg-zinc-100 dark:bg-zinc-700/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm",
                      aspectRatio === ratio.id
                        ? "text-zinc-900 dark:text-white font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {ratio.label}
                  </span>
                  <AspectRatioIcon
                    ratio={ratio.id}
                    className={cn(
                      "w-6 h-6",
                      aspectRatio === ratio.id
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media indicator / carousel button */}
        {media.length > 1 && (
          <div className="flex items-center gap-1">
            {media.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  idx === currentIndex
                    ? "bg-[#0095f6]"
                    : "bg-zinc-300 dark:bg-zinc-600"
                )}
              />
            ))}
          </div>
        )}

        {/* Multiple media button */}
        <button className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700/80 transition-colors">
          <Copy className="w-5 h-5 text-zinc-900 dark:text-white" />
        </button>
      </div>
    </div>
  );
}

// Instagram bottom navigation
function BottomNav() {
  return (
    <div className="flex items-center justify-around py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <Home className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      <Search className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      <PlusSquare className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      <Film className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
      <div className="w-6 h-6 rounded-full border-2 border-zinc-900 dark:border-zinc-100 overflow-hidden">
        <User className="w-full h-full text-zinc-900 dark:text-zinc-100" />
      </div>
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
  const mockPosts = [
    ...media,
    ...Array(8 - Math.min(media.length, 8)).fill(null),
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Instagram Header */}
      <InstagramProfileHeader username={username} />

      {/* Profile header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-6">
          {/* Profile image */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden p-[3px] shrink-0"
            style={{
              background:
                "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-black">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-zinc-400" />
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 flex items-center justify-around pt-2">
            <div className="text-center">
              <div className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                {media.length || 0}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                posts
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                1.2K
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                followers
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                500
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                following
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-3">
          <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {username}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Digital Creator
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Edit profile
          </button>
          <button className="flex-1 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Share profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-t border-zinc-200 dark:border-zinc-800">
        <button className="flex-1 py-3 flex justify-center border-b border-zinc-900 dark:border-zinc-100">
          <Grid3X3 className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
        </button>
        <button className="flex-1 py-3 flex justify-center">
          <Film className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
        </button>
        <button className="flex-1 py-3 flex justify-center">
          <Bookmark className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
        </button>
      </div>

      {/* Posts grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800">
          {mockPosts.slice(0, 9).map((post, index) => (
            <div
              key={index}
              className="aspect-square bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden"
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
                  {/* Multi-post indicator */}
                  {media.length > 1 && index === 0 && (
                    <div className="absolute top-2 right-2">
                      <svg
                        className="w-4 h-4 text-white drop-shadow-md"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5V7h7v10zm7 0h-5V7h5v10z" />
                      </svg>
                    </div>
                  )}
                  {/* Video indicator */}
                  {post.type === "video" && (
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-white fill-white drop-shadow-md" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// Feed View Component (wraps InstagramEmbedPreview)
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
  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Instagram Header */}
      <InstagramFeedHeader />

      {/* Feed content */}
      <div className="flex-1 overflow-y-auto">
        <InstagramEmbedPreview
          media={media}
          caption={caption}
          username={username}
          profileImage={profileImage}
          width="100%"
          captioned
        />
      </div>

      <BottomNav />
    </div>
  );
}

export function InstagramPhonePreview({
  media,
  caption,
  username = "username",
  profileImage,
  className,
  scale = 0.6,
}: InstagramPhonePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("crop");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const modeLabels: Record<PreviewMode, string> = {
    crop: "Crop",
    feed: "Feed",
    profile: "Profile",
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Mode tabs */}
      <div className="w-full max-w-[320px] flex items-center bg-muted/50 rounded-lg p-1 mb-4">
        {(["crop", "feed", "profile"] as PreviewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
              mode === m
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Phone mockup */}
      <IPhoneFrame scale={scale} showStatusBar={true}>
        {mode === "crop" ? (
          <CropView
            media={media}
            currentIndex={currentMediaIndex}
            onIndexChange={setCurrentMediaIndex}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
          />
        ) : mode === "feed" ? (
          <FeedView
            media={media}
            caption={caption}
            username={username}
            profileImage={profileImage}
          />
        ) : (
          <ProfileView
            media={media}
            username={username}
            profileImage={profileImage}
          />
        )}
      </IPhoneFrame>
    </div>
  );
}
