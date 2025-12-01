"use client";

import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND_VOICES = [
  {
    value: "professional",
    name: "Professional",
    description: "Formal, expert, authoritative",
    icon: "💼",
  },
  {
    value: "casual",
    name: "Casual & Friendly",
    description: "Relaxed, conversational, approachable",
    icon: "😊",
  },
  {
    value: "humorous",
    name: "Humorous",
    description: "Fun, witty, entertaining",
    icon: "😄",
  },
  {
    value: "inspirational",
    name: "Inspirational",
    description: "Motivating, uplifting, empowering",
    icon: "✨",
  },
  {
    value: "educational",
    name: "Educational",
    description: "Informative, teaching, explaining",
    icon: "🎓",
  },
];

const THEME_SUGGESTIONS = [
  "Health & Fitness",
  "Technology",
  "Fashion",
  "Food & Cooking",
  "Travel",
  "Finance",
  "Personal Development",
  "Business",
  "Marketing",
  "Design",
  "Photography",
  "Music",
  "Art",
  "Gaming",
  "Sports",
];

interface Step7Data {
  contentThemes: string[];
  brandVoice: string;
}

interface Step7ContentThemesProps {
  data: Step7Data;
  onDataChange: (data: Step7Data) => void;
}

export function Step7ContentThemes({ data, onDataChange }: Step7ContentThemesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content themes & voice</h2>
        <p className="text-muted-foreground">
          Define what you'll talk about and how you'll communicate.
        </p>
      </div>

      {/* Content Themes */}
      <div className="space-y-2">
        <Label>Content Themes/Topics</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What topics or niches will your content cover?
        </p>
        <TagInput
          tags={data.contentThemes}
          onTagsChange={(contentThemes) => onDataChange({ ...data, contentThemes })}
          placeholder="Type a theme and press Enter..."
          maxTags={10}
        />
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {THEME_SUGGESTIONS.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => {
                  if (!data.contentThemes.includes(theme) && data.contentThemes.length < 10) {
                    onDataChange({
                      ...data,
                      contentThemes: [...data.contentThemes, theme],
                    });
                  }
                }}
                className="px-3 py-1 text-xs rounded-full border border-border hover:border-emerald-300 hover:bg-emerald-500/10 transition-all"
              >
                + {theme}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Voice */}
      <div className="space-y-2">
        <Label>Brand Voice</Label>
        <p className="text-sm text-muted-foreground mb-3">
          How do you want to communicate with your audience?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRAND_VOICES.map((voice) => (
            <button
              key={voice.value}
              type="button"
              onClick={() => onDataChange({ ...data, brandVoice: voice.value })}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-left",
                data.brandVoice === voice.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              {data.brandVoice === voice.value && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-3xl">{voice.icon}</span>
                <div>
                  <h3 className="font-semibold">{voice.name}</h3>
                  <p className="text-sm text-muted-foreground">{voice.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

