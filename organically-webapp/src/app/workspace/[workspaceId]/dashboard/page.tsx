"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { OnboardingPrompt } from "@/components/workspace/OnboardingPrompt";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="bg-background relative overflow-hidden min-h-[calc(100vh-5rem)]">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute right-1/3 bottom-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-3xl rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Onboarding Prompt */}
          {activeWorkspace && !activeWorkspace.onboardingCompleted && (
            <OnboardingPrompt
              workspaceId={activeWorkspace.id}
              currentStep={activeWorkspace.onboardingStep || 1}
              totalSteps={8}
            />
          )}

          {/* Welcome Card */}
          <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-4">
              <div className="text-6xl mb-4">{activeWorkspace?.icon}</div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Welcome to{" "}
                <span className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  {activeWorkspace?.name}
                </span>
              </h1>

              {activeWorkspace?.description && (
                <p className="text-lg text-muted-foreground">
                  {activeWorkspace.description}
                </p>
              )}

              {user?.email && (
                <p className="text-sm text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {user.email}
                  </span>
                </p>
              )}
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground mb-6">
                Your personalized content growth dashboard is coming soon.
              </p>
            </div>
          </div>

          {/* Quick Stats Placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Content Plans
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Platforms</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Posts Generated
              </p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

