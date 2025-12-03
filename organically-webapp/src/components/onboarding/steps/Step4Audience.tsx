"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { AGE_RANGES, GENDERS } from "@/lib/profile-constants";

interface Step4Data {
  targetAudience: {
    ageRanges: string[];
    genders: string[];
  };
}

interface Step4AudienceProps {
  data: Step4Data;
  onDataChange: (data: Step4Data) => void;
}

export function Step4Audience({ data, onDataChange }: Step4AudienceProps) {
  const toggleAgeRange = (ageId: string) => {
    const newAgeRanges = data.targetAudience.ageRanges.includes(ageId)
      ? data.targetAudience.ageRanges.filter((a) => a !== ageId)
      : [...data.targetAudience.ageRanges, ageId];
    
    onDataChange({
      targetAudience: {
        ...data.targetAudience,
        ageRanges: newAgeRanges,
      },
    });
  };

  const toggleGender = (genderId: string) => {
    // If "All genders" is selected, clear other selections
    if (genderId === "all") {
      onDataChange({
        targetAudience: {
          ...data.targetAudience,
          genders: data.targetAudience.genders.includes("all") ? [] : ["all"],
        },
      });
      return;
    }

    // If selecting a specific gender and "all" is selected, remove "all"
    let newGenders = data.targetAudience.genders.filter((g) => g !== "all");
    
    if (newGenders.includes(genderId)) {
      newGenders = newGenders.filter((g) => g !== genderId);
    } else {
      newGenders = [...newGenders, genderId];
    }
    
    onDataChange({
      targetAudience: {
        ...data.targetAudience,
        genders: newGenders,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Audience</h2>
        <p className="text-muted-foreground">
          Who are you creating content for? Select all that apply.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
          {AGE_RANGES.map((age) => {
            const isSelected = data.targetAudience.ageRanges.includes(age.id);

            return (
              <button
                key={age.id}
                type="button"
                onClick={() => toggleAgeRange(age.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] flex items-center gap-3 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                  <span className="text-2xl">{age.icon}</span>
              <span className="font-medium">{age.label}</span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-emerald-500" />
                  )}
              </button>
            );
          })}
          {GENDERS.map((gender) => {
            const isSelected = data.targetAudience.genders.includes(gender.id);

            return (
              <button
                key={gender.id}
                type="button"
                onClick={() => toggleGender(gender.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] flex items-center gap-3 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                  <span className="text-2xl">{gender.icon}</span>
              <span className="font-medium">{gender.label}</span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-emerald-500" />
                  )}
              </button>
            );
          })}
      </div>

      {(data.targetAudience.ageRanges.length > 0 || data.targetAudience.genders.length > 0) && (
        <div className="text-sm text-muted-foreground text-center pt-2">
          {data.targetAudience.ageRanges.length > 0 && (
            <span>{data.targetAudience.ageRanges.length} age group{data.targetAudience.ageRanges.length > 1 ? "s" : ""}</span>
          )}
          {data.targetAudience.ageRanges.length > 0 && data.targetAudience.genders.length > 0 && (
            <span> · </span>
          )}
          {data.targetAudience.genders.length > 0 && (
            <span>{data.targetAudience.genders.length} gender option{data.targetAudience.genders.length > 1 ? "s" : ""}</span>
          )}
          {" "}selected
        </div>
      )}
    </div>
  );
}

