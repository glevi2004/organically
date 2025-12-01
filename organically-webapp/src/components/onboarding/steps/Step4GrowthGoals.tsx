"use client";

import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const GROWTH_GOALS = [
  { id: "followers", name: "Grow followers/subscribers", icon: "📈" },
  { id: "engagement", name: "Increase engagement", icon: "💬" },
  { id: "brand_awareness", name: "Build brand awareness", icon: "🎯" },
  { id: "sales", name: "Drive sales/conversions", icon: "💰" },
  { id: "leads", name: "Generate leads", icon: "🎣" },
  { id: "community", name: "Build community", icon: "👥" },
];

const FOLLOWER_GOALS = [
  { value: "1k", label: "1,000 followers" },
  { value: "10k", label: "10,000 followers" },
  { value: "100k", label: "100,000 followers" },
  { value: "1m", label: "1,000,000 followers" },
  { value: "custom", label: "Just getting started" },
];

const TIMEFRAMES = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "no_rush", label: "No specific timeframe" },
];

interface Step4Data {
  growthGoals: string[];
  followerGoal: string;
  timeframe: string;
}

interface Step4GrowthGoalsProps {
  data: Step4Data;
  onDataChange: (data: Step4Data) => void;
}

export function Step4GrowthGoals({ data, onDataChange }: Step4GrowthGoalsProps) {
  const toggleGoal = (goalId: string) => {
    if (data.growthGoals.includes(goalId)) {
      onDataChange({
        ...data,
        growthGoals: data.growthGoals.filter((g) => g !== goalId),
      });
    } else {
      onDataChange({
        ...data,
        growthGoals: [...data.growthGoals, goalId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What are your growth goals?</h2>
        <p className="text-muted-foreground">
          Select all that apply. This helps us recommend the right content strategy.
        </p>
      </div>

      {/* Growth Goals */}
      <div className="space-y-2">
        <Label>Growth Goals (select all that apply)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GROWTH_GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3",
                data.growthGoals.includes(goal.id)
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-sm font-medium">{goal.name}</span>
              {data.growthGoals.includes(goal.id) && (
                <Check className="w-4 h-4 text-emerald-500 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Follower Goal */}
      <div className="space-y-2">
        <Label>Follower Goal</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FOLLOWER_GOALS.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() =>
                onDataChange({ ...data, followerGoal: goal.value })
              }
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center text-sm font-medium",
                data.followerGoal === goal.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div className="space-y-2">
        <Label>Timeframe</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() =>
                onDataChange({ ...data, timeframe: tf.value })
              }
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-center text-sm font-medium",
                data.timeframe === tf.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-300"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

