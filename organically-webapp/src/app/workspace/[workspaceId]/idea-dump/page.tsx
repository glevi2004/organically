"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function IdeaDumpPage() {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Idea Dump</h1>
        <p className="text-muted-foreground mt-2">
          Capture all your content ideas for {activeWorkspace?.name}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">💡</div>
        <h3 className="text-xl font-semibold mb-2">No ideas yet</h3>
        <p className="text-muted-foreground mb-6">
          Start capturing your content ideas here. They'll be organized and ready
          to turn into posts.
        </p>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

