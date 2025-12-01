"use client";

import { useProfile } from "@/contexts/ProfileContext";

export default function PostsPage() {
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your content posts
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Posts management coming soon...
        </p>
      </div>
    </div>
  );
}
