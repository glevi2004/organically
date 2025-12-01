"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function CalendarPage() {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Plan and schedule your content for {activeWorkspace?.name}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold mb-2">Your calendar is empty</h3>
        <p className="text-muted-foreground mb-6">
          Start planning your content calendar. Schedule posts, track deadlines,
          and stay organized.
        </p>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

