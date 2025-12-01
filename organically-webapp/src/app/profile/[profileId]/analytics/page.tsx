"use client";

import { useProfile } from "@/contexts/ProfileContext";

export default function AnalyticsPage() {
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your content performance for {activeProfile?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Engagement Rate</h3>
          <p className="text-3xl font-bold mt-2">0%</p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Followers</h3>
          <p className="text-3xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
