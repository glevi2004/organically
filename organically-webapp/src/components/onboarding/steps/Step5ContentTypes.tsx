"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  { id: "short_form", name: "Short-form video", description: "< 60 seconds", icon: "📱" },
  { id: "long_form", name: "Long-form video", description: "> 1 minute", icon: "🎥" },
  { id: "reels", name: "Reels/Shorts", description: "Quick, snappy content", icon: "⚡" },
  { id: "stories", name: "Stories", description: "24-hour content", icon: "📸" },
  { id: "carousels", name: "Carousels", description: "Multi-image posts", icon: "🖼️" },
  { id: "live", name: "Live streams", description: "Real-time content", icon: "🔴" },
  { id: "threads", name: "Text posts/Threads", description: "Written content", icon: "📝" },
  { id: "podcasts", name: "Podcasts", description: "Audio content", icon: "🎙️" },
];

const CONTENT_FORMATS = [
  { id: "educational", name: "Educational", icon: "🎓" },
  { id: "entertaining", name: "Entertaining", icon: "🎭" },
  { id: "inspirational", name: "Inspirational", icon: "✨" },
  { id: "promotional", name: "Promotional", icon: "📢" },
  { id: "behind_scenes", name: "Behind-the-scenes", icon: "🎬" },
  { id: "ugc", name: "User-generated", icon: "👥" },
];

interface Step5Data {
  contentTypes: string[];
  contentFormats: string[];
}

interface Step5ContentTypesProps {
  data: Step5Data;
  onDataChange: (data: Step5Data) => void;
}

export function Step5ContentTypes({ data, onDataChange }: Step5ContentTypesProps) {
  const toggleType = (typeId: string) => {
    if (data.contentTypes.includes(typeId)) {
      onDataChange({
        ...data,
        contentTypes: data.contentTypes.filter((t) => t !== typeId),
      });
    } else {
      onDataChange({
        ...data,
        contentTypes: [...data.contentTypes, typeId],
      });
    }
  };

  const toggleFormat = (formatId: string) => {
    if (data.contentFormats.includes(formatId)) {
      onDataChange({
        ...data,
        contentFormats: data.contentFormats.filter((f) => f !== formatId),
      });
    } else {
      onDataChange({
        ...data,
        contentFormats: [...data.contentFormats, formatId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What content will you create?</h2>
        <p className="text-muted-foreground">
          Choose the types and styles of content you want to produce.
        </p>
      </div>

      {/* Content Types */}
      <div className="space-y-2">
        <Label>Content Types (select all that apply)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleType(type.id)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all text-left",
                data.contentTypes.includes(type.id)
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{type.name}</h3>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                {data.contentTypes.includes(type.id) && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Formats/Styles */}
      <div className="space-y-2">
        <Label>Content Style (select all that apply)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONTENT_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => toggleFormat(format.id)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                data.contentFormats.includes(format.id)
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <span className="text-xl">{format.icon}</span>
              <span className="text-sm font-medium">{format.name}</span>
              {data.contentFormats.includes(format.id) && (
                <Check className="w-4 h-4 text-emerald-500 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

