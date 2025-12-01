"use client";

import { Check } from "lucide-react";

const CONSISTENCY_LEVELS = [
  {
    id: "casual",
    name: "Casual Cruiser",
    description: "Grow with minimal effort — chill pace, zero overwhelm.",
    frequency: "~3 posts/week",
    growth: "⭐ Slow",
    bestFor: "Busy people who want gentle, low-pressure consistency.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "steady",
    name: "Steady Grinder",
    description: "Steady, creator-mode posting with real momentum.",
    frequency: "1–2 posts/day",
    growth: "⭐⭐ Moderate–Fast",
    bestFor: "People who want predictable growth and are ready to show up regularly.",
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "aggressive",
    name: "Algorithm Soldier",
    description: "Go all-in, post aggressively, and maximize reach everywhere.",
    frequency: "3–6 posts/day",
    growth: "⭐⭐⭐ Very Fast",
    bestFor: "Launch mode, startups, or anyone grinding like the algorithm owes them money.",
    color: "from-orange-500 to-red-600",
  },
];

interface Step3Data {
  consistencyLevel: string;
}

interface Step3ConsistencyProps {
  data: Step3Data;
  onDataChange: (data: Step3Data) => void;
}

export function Step3Consistency({ data, onDataChange }: Step3ConsistencyProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">How Consistent Are You Willing to Be?</h2>
        <p className="text-muted-foreground">
          Choose your posting commitment level. You can always adjust later.
        </p>
      </div>

      <div className="space-y-4">
        {CONSISTENCY_LEVELS.map((level) => {
          const isSelected = data.consistencyLevel === level.id;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onDataChange({ consistencyLevel: level.id })}
              className={`w-full text-left p-5 rounded-lg border-2 transition-all hover:scale-[1.01] ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-lg`}>
                  {level.id === "casual" ? "😎" : level.id === "steady" ? "💪" : "🔥"}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{level.name}</h3>
                    {isSelected && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground mb-3">
                    {level.description}
                  </p>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Posting frequency:</span>
                      <span className="font-medium">{level.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Expected growth:</span>
                      <span className="font-medium">{level.growth}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground">Best for:</span>
                      <span className="ml-1 text-sm">{level.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

