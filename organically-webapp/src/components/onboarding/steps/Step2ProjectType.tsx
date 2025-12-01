"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  {
    id: "personal_brand",
    name: "Personal Brand",
    description: "Building your personal presence online",
    icon: "👤",
  },
  {
    id: "business",
    name: "Small Business",
    description: "Growing a local or online business",
    icon: "🏪",
  },
  {
    id: "agency",
    name: "Agency/Team",
    description: "Managing content for multiple clients",
    icon: "👥",
  },
  {
    id: "creator",
    name: "Content Creator",
    description: "Creating content as your primary focus",
    icon: "🎬",
  },
  {
    id: "nonprofit",
    name: "Nonprofit",
    description: "Promoting a cause or organization",
    icon: "❤️",
  },
  {
    id: "other",
    name: "Other",
    description: "Something else entirely",
    icon: "✨",
  },
];

interface Step2Data {
  projectType: string;
  projectTypeOther: string;
}

interface Step2ProjectTypeProps {
  data: Step2Data;
  onDataChange: (data: Step2Data) => void;
}

export function Step2ProjectType({ data, onDataChange }: Step2ProjectTypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What type of project is this?</h2>
        <p className="text-muted-foreground">
          This helps us tailor content suggestions to your specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROJECT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() =>
              onDataChange({ ...data, projectType: type.id })
            }
            className={cn(
              "relative p-4 rounded-lg border-2 transition-all hover:scale-105 text-left",
              data.projectType === type.id
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-border hover:border-emerald-300"
            )}
          >
            {data.projectType === type.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-3xl">{type.icon}</span>
              <div>
                <h3 className="font-semibold">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {data.projectType === "other" && (
        <div className="space-y-2">
          <Label htmlFor="project-type-other">
            Please specify <span className="text-destructive">*</span>
          </Label>
          <Input
            id="project-type-other"
            type="text"
            placeholder="Tell us about your project..."
            value={data.projectTypeOther}
            onChange={(e) =>
              onDataChange({ ...data, projectTypeOther: e.target.value })
            }
            maxLength={100}
          />
        </div>
      )}
    </div>
  );
}

