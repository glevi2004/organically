"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface OnboardingPromptProps {
  profileId: string;
  currentStep: number;
  totalSteps: number;
}

export function OnboardingPrompt({
  profileId,
  currentStep,
  totalSteps,
}: OnboardingPromptProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
              Complete your profile setup
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
            You're {progressPercentage}% done! Complete the setup to unlock AI-powered content
            suggestions and personalized growth strategies.
          </p>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Step {currentStep} of {totalSteps} completed
            </p>
          </div>
          
          <Button
            onClick={() => router.push(`/onboarding?profileId=${profileId}`)}
            size="sm"
            className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
          >
            Continue Setup
          </Button>
        </div>
      </div>
    </div>
  );
}
