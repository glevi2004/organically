"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMOJI_OPTIONS = ["🌱", "💼", "🚀", "🎨", "📱", "💡", "🎯", "⚡", "🔥", "✨"];

interface Step1Data {
  name: string;
  icon: string;
  description: string;
}

interface Step1BasicsProps {
  data: Step1Data;
  onDataChange: (data: Step1Data) => void;
}

export function Step1Basics({ data, onDataChange }: Step1BasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Your Workspace</h2>
        <p className="text-muted-foreground">
          Let's start with the basics. A workspace is where you'll manage your content plans, ideas, and posts.
        </p>
      </div>

      {/* Icon Picker */}
      <div className="space-y-2">
        <Label>Workspace Icon</Label>
        <div className="flex gap-2 flex-wrap">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onDataChange({ ...data, icon: emoji })}
              className={`text-3xl p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                data.icon === emoji
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Name */}
      <div className="space-y-2">
        <Label htmlFor="workspace-name">
          Workspace Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="workspace-name"
          type="text"
          placeholder="e.g., Personal Brand, Startup, Agency"
          value={data.name}
          onChange={(e) => onDataChange({ ...data, name: e.target.value })}
          required
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {data.name.length}/50 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="What's this workspace for?"
          value={data.description}
          onChange={(e) => onDataChange({ ...data, description: e.target.value })}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {data.description.length}/100 characters
        </p>
      </div>
    </div>
  );
}

