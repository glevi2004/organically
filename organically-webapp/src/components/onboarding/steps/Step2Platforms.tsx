"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import Image from "next/image";

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    logo: "/logos/instagram.svg",
  },
  {
    id: "tiktok",
    name: "TikTok",
    logo: "/logos/tiktok.svg",
  },
  {
    id: "youtube",
    name: "YouTube",
    logo: "/logos/youtube.svg",
  },
  {
    id: "x",
    name: "X (Twitter)",
    logo: "/logos/x.svg",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    logo: "/logos/linkedin.svg",
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

      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = data.platforms.includes(platform.id);

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] flex items-center gap-3 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <Image
                src={platform.logo}
                alt={platform.name}
                width={24}
                height={24}
                className="shrink-0"
              />
              <span className="font-medium">{platform.name}</span>
                {isSelected && (
                <Check className="w-5 h-5 text-emerald-500" />
                )}
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

