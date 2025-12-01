"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Platform {
  id: string;
  name: string;
  icon: string; // Using emoji for simplicity
  color: string; // For visual differentiation
}

const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    color: "bg-pink-100 dark:bg-pink-900/20",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "bg-black/5 dark:bg-white/5",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    color: "bg-red-100 dark:bg-red-900/20",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "𝕏",
    color: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "threads",
    name: "Threads",
    icon: "🧵",
    color: "bg-purple-100 dark:bg-purple-900/20",
  },
];

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  primaryPlatform?: string;
  onPrimaryPlatformChange?: (platform: string) => void;
  showPrimary?: boolean;
}

export function PlatformSelector({
  selectedPlatforms,
  onPlatformsChange,
  primaryPlatform,
  onPrimaryPlatformChange,
  showPrimary = false,
}: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter((id) => id !== platformId));

      // If removing the primary platform, clear it
      if (primaryPlatform === platformId && onPrimaryPlatformChange) {
        const remaining = selectedPlatforms.filter((id) => id !== platformId);
        onPrimaryPlatformChange(remaining[0] || "");
      }
    } else {
      const newPlatforms = [...selectedPlatforms, platformId];
      onPlatformsChange(newPlatforms);

      // Auto-set as primary if it's the first platform
      if (newPlatforms.length === 1 && onPrimaryPlatformChange) {
        onPrimaryPlatformChange(platformId);
      }
    }
  };

  const setPrimary = (platformId: string) => {
    if (selectedPlatforms.includes(platformId) && onPrimaryPlatformChange) {
      onPrimaryPlatformChange(platformId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isPrimary = primaryPlatform === platform.id;

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all hover:scale-105 flex flex-col items-center gap-2",
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                  platform.color
                )}
              >
                {platform.icon}
              </div>

              <span className="text-sm font-medium text-center">
                {platform.name}
              </span>

              {isPrimary && showPrimary && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Primary
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Primary Platform Selection */}
      {showPrimary && selectedPlatforms.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Primary Platform <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Choose your main platform that you'll focus on the most
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPlatforms.map((platformId) => {
              const platform = PLATFORMS.find((p) => p.id === platformId);
              if (!platform) return null;

              const isPrimary = primaryPlatform === platformId;

              return (
                <button
                  key={platformId}
                  type="button"
                  onClick={() => setPrimary(platformId)}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2",
                    isPrimary
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  )}
                >
                  <span>{platform.icon}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                  {isPrimary && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { PLATFORMS };
