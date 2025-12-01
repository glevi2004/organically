"use client";

import { useProfile } from "@/contexts/ProfileContext";

export default function CalendarPage() {
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Plan and schedule your content
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Content calendar coming soon...
        </p>
      </div>
    </div>
  );
}
