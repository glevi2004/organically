"use client";

import { Check } from "lucide-react";
import { CONTENT_TYPES } from "@/lib/profile-constants";

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

      <div className="flex flex-wrap gap-3">
        {CONTENT_TYPES.map((type) => {
          const isSelected = data.contentTypes.includes(type.id);

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleContentType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] flex items-center gap-3 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                    {isSelected && (
                <Check className="w-5 h-5 text-emerald-500" />
                    )}
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
