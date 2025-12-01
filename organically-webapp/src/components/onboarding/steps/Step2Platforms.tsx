"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "from-black to-cyan-500",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    color: "from-red-500 to-red-600",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: "✖️",
    color: "from-gray-800 to-gray-900",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "threads",
    name: "Threads",
    icon: "🧵",
    color: "from-gray-900 to-black",
  },
];

interface Step2Data {
  platforms: string[];
}

interface Step2PlatformsProps {
  data: Step2Data;
  onDataChange: (data: Step2Data) => void;
}

export function Step2Platforms({ data, onDataChange }: Step2PlatformsProps) {
  const togglePlatform = (platformId: string) => {
    const newPlatforms = data.platforms.includes(platformId)
      ? data.platforms.filter((p) => p !== platformId)
      : [...data.platforms, platformId];
    
    onDataChange({ platforms: newPlatforms });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Which platforms will you use?</h2>
        <p className="text-muted-foreground">
          Select all the platforms where you want to grow your presence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = data.platforms.includes(platform.id);

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`text-2xl w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                  {platform.icon}
                </div>
                <span className="font-medium text-left">{platform.name}</span>
                {isSelected && (
                  <Check className="ml-auto w-5 h-5 text-emerald-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {data.platforms.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {data.platforms.length} platform{data.platforms.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

