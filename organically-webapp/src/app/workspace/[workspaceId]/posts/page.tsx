"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function PostsPage() {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-muted-foreground mt-2">
          Manage all your content posts for {activeWorkspace?.name}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first post and start building your content library. AI-powered
          content generation coming soon.
        </p>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

