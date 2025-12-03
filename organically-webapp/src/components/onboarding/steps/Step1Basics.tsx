"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHES } from "@/lib/profile-constants";

interface Step1Data {
  name: string;
  imageFile?: File | null;
  currentImageUrl?: string;
  description?: string;
  niche?: string[];
  brandVoice?: string;
  valuesMission?: string;
}

interface Step1BasicsProps {
  data: Step1Data;
  onDataChange: (data: Step1Data) => void;
}

export function Step1Basics({ data, onDataChange }: Step1BasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
        <p className="text-muted-foreground">
          Let's start with the basics. Your profile is where you'll manage your
          content plans, ideas, and posts.
        </p>
      </div>

      {/* Profile Image */}
      <div className="space-y-2">
        <Label>Profile Image</Label>
        <ImageUpload
          value={data.imageFile || data.currentImageUrl}
          onChange={(file) => onDataChange({ ...data, imageFile: file })}
          placeholder="Upload a profile image"
        />
      </div>

      {/* Profile Name */}
      <div className="space-y-2">
        <Label htmlFor="profile-name">
          Profile Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="profile-name"
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

      {/* Description/Bio */}
      <div className="space-y-2">
        <Label htmlFor="description">Description / Bio</Label>
        <textarea
          id="description"
          rows={4}
          placeholder="Describe your brand or personal profile in 200-500 characters..."
          value={data.description || ""}
          onChange={(e) =>
            onDataChange({ ...data, description: e.target.value })
          }
          maxLength={500}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "resize-none"
          )}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(data.description || "").length}/500 characters
          </p>
          {(data.description || "").length > 0 &&
            (data.description || "").length < 200 && (
              <p className="text-xs text-amber-600">
                Minimum 200 characters recommended
              </p>
            )}
        </div>
      </div>

      {/* Niche/Category */}
      <div className="space-y-2">
        <Label>Niche / Category</Label>
        <p className="text-sm text-muted-foreground">
          Select one or more categories that best describe your content
        </p>
        <div className="flex flex-wrap gap-3">
          {NICHES.map((niche) => (
            <button
              key={niche.id}
              type="button"
              onClick={() => {
                const currentNiche = data.niche || [];
                const newNiche = currentNiche.includes(niche.id)
                  ? currentNiche.filter((n) => n !== niche.id)
                  : [...currentNiche, niche.id];
                onDataChange({ ...data, niche: newNiche });
              }}
              className={cn(
                "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                (data.niche || []).includes(niche.id)
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <span className="text-xl">{niche.icon}</span>
              <span className="text-sm font-medium">{niche.label}</span>
              {(data.niche || []).includes(niche.id) && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Voice/Tone */}
      <div className="space-y-2">
        <Label htmlFor="brandVoice">Brand Voice / Tone</Label>
        <textarea
          id="brandVoice"
          rows={4}
          placeholder="Describe your brand's voice and tone in 200-500 characters. How do you want to communicate with your audience?"
          value={data.brandVoice || ""}
          onChange={(e) =>
            onDataChange({ ...data, brandVoice: e.target.value })
          }
          maxLength={500}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "resize-none"
          )}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(data.brandVoice || "").length}/500 characters
          </p>
          {(data.brandVoice || "").length > 0 &&
            (data.brandVoice || "").length < 200 && (
              <p className="text-xs text-amber-600">
                Minimum 200 characters recommended
              </p>
            )}
        </div>
      </div>

      {/* Values / Mission */}
      <div className="space-y-2">
        <Label htmlFor="valuesMission">Values / Mission</Label>
        <textarea
          id="valuesMission"
          rows={4}
          placeholder="Describe your brand's values and mission in 200-500 characters. What drives you and what do you stand for?"
          value={data.valuesMission || ""}
          onChange={(e) =>
            onDataChange({ ...data, valuesMission: e.target.value })
          }
          maxLength={500}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "resize-none"
          )}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(data.valuesMission || "").length}/500 characters
          </p>
          {(data.valuesMission || "").length > 0 &&
            (data.valuesMission || "").length < 200 && (
              <p className="text-xs text-amber-600">
                Minimum 200 characters recommended
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
