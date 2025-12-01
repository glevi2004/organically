"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS } from "@/components/onboarding/PlatformSelector";

const POSTING_TIMES = [
  { value: "morning", label: "Morning", time: "6am-12pm", icon: "🌅" },
  { value: "afternoon", label: "Afternoon", time: "12pm-5pm", icon: "☀️" },
  { value: "evening", label: "Evening", time: "5pm-9pm", icon: "🌆" },
  { value: "night", label: "Night", time: "9pm-12am", icon: "🌙" },
];

interface Step8Data {
  postingFrequency: {
    [key: string]: number;
  };
  preferredPostingTimes: string[];
  selectedPlatforms: string[]; // Passed from Step 3
}

interface Step8PostingScheduleProps {
  data: Step8Data;
  onDataChange: (data: Step8Data) => void;
}

export function Step8PostingSchedule({ data, onDataChange }: Step8PostingScheduleProps) {
  const updateFrequency = (platform: string, frequency: number) => {
    onDataChange({
      ...data,
      postingFrequency: {
        ...data.postingFrequency,
        [platform]: Math.max(0, Math.min(21, frequency)), // 0-21 posts per week
      },
    });
  };

  const togglePostingTime = (time: string) => {
    if (data.preferredPostingTimes.includes(time)) {
      onDataChange({
        ...data,
        preferredPostingTimes: data.preferredPostingTimes.filter((t) => t !== time),
      });
    } else {
      onDataChange({
        ...data,
        preferredPostingTimes: [...data.preferredPostingTimes, time],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Posting schedule</h2>
        <p className="text-muted-foreground">
          Set your content posting frequency for each platform.
        </p>
      </div>

      {/* Posting Frequency per Platform */}
      <div className="space-y-4">
        <Label>Posts per Week</Label>
        {data.selectedPlatforms.map((platformId) => {
          const platform = PLATFORMS.find((p) => p.id === platformId);
          if (!platform) return null;

          const frequency = data.postingFrequency[platformId] || 3;

          return (
            <div key={platformId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="21"
                  value={frequency}
                  onChange={(e) =>
                    updateFrequency(platformId, parseInt(e.target.value) || 0)
                  }
                  className="w-20 text-center"
                />
              </div>
              <input
                type="range"
                min="0"
                max="21"
                value={frequency}
                onChange={(e) =>
                  updateFrequency(platformId, parseInt(e.target.value))
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-xs text-muted-foreground text-right">
                {frequency === 0
                  ? "No regular posts"
                  : frequency === 1
                  ? "1 post per week"
                  : `${frequency} posts per week`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Preferred Posting Times */}
      <div className="space-y-2">
        <Label>Preferred Posting Times (select all that apply)</Label>
        <p className="text-sm text-muted-foreground mb-3">
          When do you plan to post most often?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POSTING_TIMES.map((timeSlot) => (
            <button
              key={timeSlot.value}
              type="button"
              onClick={() => togglePostingTime(timeSlot.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-center",
                data.preferredPostingTimes.includes(timeSlot.value)
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <div className="text-3xl mb-2">{timeSlot.icon}</div>
              <div className="font-semibold text-sm">{timeSlot.label}</div>
              <div className="text-xs text-muted-foreground">{timeSlot.time}</div>
              {data.preferredPostingTimes.includes(timeSlot.value) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

