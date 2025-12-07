"use client";

import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function AutomationsPage() {
  const { activeOrganization } = useOrganization();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Automations are under development. Soon you'll be able to:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Schedule posts to be published automatically</li>
            <li>Set up recurring content schedules</li>
            <li>Create automated workflows for content repurposing</li>
            <li>Get AI-powered content suggestions at optimal times</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
