"use client";

import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const AGE_RANGES = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
  { value: "all", label: "All ages" },
];

const GENDERS = [
  { value: "all", label: "All genders", icon: "👥" },
  { value: "male", label: "Male", icon: "👨" },
  { value: "female", label: "Female", icon: "👩" },
  { value: "non_binary", label: "Non-binary", icon: "🌈" },
];

interface Step6Data {
  targetAudience: {
    ageRange: string;
    gender: string;
    interests: string[];
    painPoints: string[];
  };
}

interface Step6TargetAudienceProps {
  data: Step6Data;
  onDataChange: (data: Step6Data) => void;
}

export function Step6TargetAudience({ data, onDataChange }: Step6TargetAudienceProps) {
  const updateAudience = (updates: Partial<Step6Data["targetAudience"]>) => {
    onDataChange({
      ...data,
      targetAudience: {
        ...data.targetAudience,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Who is your target audience?</h2>
        <p className="text-muted-foreground">
          Understanding your audience helps us create more relevant content suggestions.
        </p>
      </div>

      {/* Age Range */}
      <div className="space-y-2">
        <Label>Age Range</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {AGE_RANGES.map((age) => (
            <button
              key={age.value}
              type="button"
              onClick={() => updateAudience({ ageRange: age.value })}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center text-sm font-medium",
                data.targetAudience.ageRange === age.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Gender</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GENDERS.map((gender) => (
            <button
              key={gender.value}
              type="button"
              onClick={() => updateAudience({ gender: gender.value })}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                data.targetAudience.gender === gender.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <span className="text-xl">{gender.icon}</span>
              <span className="text-sm font-medium">{gender.label}</span>
              {data.targetAudience.gender === gender.value && (
                <Check className="w-4 h-4 text-emerald-500 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label>Interests & Hobbies</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What are your audience's interests? (e.g., "Fitness", "Technology", "Cooking")
        </p>
        <TagInput
          tags={data.targetAudience.interests}
          onTagsChange={(interests) => updateAudience({ interests })}
          placeholder="Type an interest and press Enter..."
          maxTags={10}
        />
      </div>

      {/* Pain Points */}
      <div className="space-y-2">
        <Label>Pain Points</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What problems does your content help solve? (e.g., "Weight loss", "Career growth")
        </p>
        <TagInput
          tags={data.targetAudience.painPoints}
          onTagsChange={(painPoints) => updateAudience({ painPoints })}
          placeholder="Type a pain point and press Enter..."
          maxTags={10}
        />
      </div>
    </div>
  );
}

