"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { cn } from "@/lib/utils";
import { StepBasicsData } from "@/types/onboarding";

interface Step1BasicsProps {
  data: StepBasicsData;
  onDataChange: (data: StepBasicsData) => void;
}

export function Step1Basics({ data, onDataChange }: Step1BasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Your Organization</h2>
        <p className="text-muted-foreground">
          Let's start with the basics. Your organization is where you'll manage
          your content plans, ideas, and posts.
        </p>
      </div>

      {/* Organization Image */}
      <div className="space-y-2">
        <Label>Organization Image</Label>
        <ImageUpload
          value={data.imageFile || data.currentImageUrl}
          onChange={(file) => onDataChange({ ...data, imageFile: file })}
          placeholder="Upload an organization image"
        />
      </div>

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="organization-name">
          Organization Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="organization-name"
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
    </div>
  );
}
