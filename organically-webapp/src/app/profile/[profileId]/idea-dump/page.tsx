"use client";

import { useProfile } from "@/contexts/ProfileContext";

export default function IdeaDumpPage() {
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Idea Dump</h1>
        <p className="text-muted-foreground mt-2">
          Capture and organize your content ideas
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Idea dump coming soon...
        </p>
      </div>
    </div>
  );
}
