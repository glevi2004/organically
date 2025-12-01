"use client";

import { Check } from "lucide-react";

const CONTENT_TYPES = [
  {
    id: "short_form_video",
    label: "Short-form video",
    description: "TikToks, Reels, Shorts",
    icon: "📱",
  },
  {
    id: "long_form_video",
    label: "Long-form video",
    description: "YouTube videos, tutorials",
    icon: "🎥",
  },
  {
    id: "stories",
    label: "Stories",
    description: "Instagram/Facebook Stories",
    icon: "📸",
  },
  {
    id: "carousels",
    label: "Carousels",
    description: "Multi-image posts",
    icon: "🎠",
  },
  {
    id: "text_posts",
    label: "Text posts / Threads",
    description: "Written content, threads",
    icon: "✍️",
  },
  {
    id: "podcasts",
    label: "Podcasts",
    description: "Audio content",
    icon: "🎙️",
  },
];

interface Step5Data {
  contentTypes: string[];
}

interface Step5ContentTypesProps {
  data: Step5Data;
  onDataChange: (data: Step5Data) => void;
}

export function Step5ContentTypes({ data, onDataChange }: Step5ContentTypesProps) {
  const toggleContentType = (typeId: string) => {
    const newTypes = data.contentTypes.includes(typeId)
      ? data.contentTypes.filter((t) => t !== typeId)
      : [...data.contentTypes, typeId];
    
    onDataChange({ contentTypes: newTypes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What content will you create?</h2>
        <p className="text-muted-foreground">
          Select all the content formats you plan to use. Mix and match for best results.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CONTENT_TYPES.map((type) => {
          const isSelected = data.contentTypes.includes(type.id);

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleContentType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{type.icon}</span>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{type.label}</span>
                    {isSelected && (
                      <Check className="ml-auto w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {data.contentTypes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {data.contentTypes.length} content type{data.contentTypes.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
