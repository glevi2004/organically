"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  canGoBack,
  canGoNext,
  isLoading = false,
  children,
}: OnboardingLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute right-1/3 bottom-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Header with Progress */}
        <div className="mb-8">
          {/* Skip Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Skip for now
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-6">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={!canGoBack || isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {currentStep === totalSteps ? "Complete" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

