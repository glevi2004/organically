"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷", color: "bg-pink-100 dark:bg-pink-900/20" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "bg-black/5 dark:bg-white/5" },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "bg-red-100 dark:bg-red-900/20" },
  { id: "x", name: "X (Twitter)", icon: "𝕏", color: "bg-blue-100 dark:bg-blue-900/20" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-100 dark:bg-blue-900/20" },
  { id: "threads", name: "Threads", icon: "🧵", color: "bg-purple-100 dark:bg-purple-900/20" },
];

interface Step3Data {
  platforms: string[];
  primaryPlatform: string;
}

interface Step3PlatformsProps {
  data: Step3Data;
  onDataChange: (data: Step3Data) => void;
}

export function Step3Platforms({ data, onDataChange }: Step3PlatformsProps) {
  const togglePlatform = (platformId: string) => {
    const isSelected = data.platforms.includes(platformId);
    
    if (isSelected) {
      // Remove platform
      const newPlatforms = data.platforms.filter((id) => id !== platformId);
      onDataChange({
        platforms: newPlatforms,
        primaryPlatform: "", // Keep for data structure compatibility
      });
    } else {
      // Add platform
      const newPlatforms = [...data.platforms, platformId];
      onDataChange({
        platforms: newPlatforms,
        primaryPlatform: "", // Keep for data structure compatibility
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Which platforms will you use?</h2>
        <p className="text-muted-foreground">
          Select all platforms where you plan to post content. You can add or remove these later.
        </p>
      </div>

      {/* Platform Grid */}
      <div className="space-y-2">
        <Label>Select Platforms (choose at least one)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLATFORMS.map((platform) => {
            const isSelected = data.platforms.includes(platform.id);

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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

