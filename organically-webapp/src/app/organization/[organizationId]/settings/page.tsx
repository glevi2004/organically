"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateOrganization,
  removeChannel,
} from "@/services/organizationService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  Trash2,
  Loader2,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Channel } from "@/types/organization";

// Instagram icon component
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className || "w-full h-full"}
    fill="currentColor"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default function SettingsPage() {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [removingChannelId, setRemovingChannelId] = useState<string | null>(
    null
  );

  // General settings
  const [name, setName] = useState(activeOrganization?.name || "");

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "instagram_connected") {
      toast.success("Instagram account connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
      refreshOrganizations();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        instagram_denied: "Instagram authorization was denied",
        instagram_failed: "Failed to connect Instagram account",
        invalid_state: "Invalid authorization state. Please try again.",
      };
      toast.error(errorMessages[error] || "An error occurred");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refreshOrganizations]);

  // Get all channels
  const channels = activeOrganization?.channels || [];

  const handleSaveGeneral = async () => {
    if (!activeOrganization || !name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setSaving(true);
    try {
      await updateOrganization(activeOrganization.id, { name: name.trim() });
      await refreshOrganizations();
      toast.success("Organization updated successfully!");
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  // Connect Instagram
  const handleConnectInstagram = () => {
    if (!activeOrganization) {
      toast.error("No active organization");
      return;
    }
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    window.location.href = `/api/auth/instagram?organizationId=${activeOrganization.id}`;
  };

  // Remove a channel
  const handleRemoveChannel = async (channelId: string) => {
    if (!activeOrganization) return;

    setRemovingChannelId(channelId);
    try {
      await removeChannel(activeOrganization.id, channelId);
      await refreshOrganizations();
      toast.success("Channel removed");
    } catch (error) {
      console.error("Error removing channel:", error);
      toast.error("Failed to remove channel");
    } finally {
      setRemovingChannelId(null);
    }
  };

  // Get channel display info
  const getChannelDisplayInfo = (channel: Channel) => {
    const username = `@${channel.accountName}`;
    const displayName = channel.label || "";
    const profileUrl = `https://instagram.com/${channel.accountName}`;

    return {
      username,
      displayName,
      profileUrl,
      profileImageUrl: channel.profileImageUrl || null,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization settings and connected channels
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Update your organization name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization-name">Organization Name</Label>
                <Input
                  id="organization-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Connected Channels</CardTitle>
                <CardDescription className="mt-1.5">
                  {channels.length === 0
                    ? "Connect your Instagram account to post content"
                    : `${channels.length} channel${
                        channels.length !== 1 ? "s" : ""
                      } connected`}
                </CardDescription>
              </div>

              <Button className="gap-2" onClick={handleConnectInstagram}>
                <Plus className="w-4 h-4" />
                Connect Instagram
              </Button>
            </CardHeader>

            <CardContent>
              {channels.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center mb-4">
                    <InstagramIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-medium text-lg mb-1">No channels yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Connect your Instagram account to start posting content
                    automatically.
                  </p>
                  <Button
                    className="mt-4 gap-2"
                    onClick={handleConnectInstagram}
                  >
                    <InstagramIcon className="w-4 h-4" />
                    Connect Instagram
                  </Button>
                </div>
              ) : (
                // Channels grid
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {channels.map((channel) => {
                    const {
                      username,
                      displayName,
                      profileUrl,
                      profileImageUrl,
                    } = getChannelDisplayInfo(channel);

                    return (
                      <div
                        key={channel.id}
                        className="group relative flex flex-col items-center p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                      >
                        {/* Profile Image with Platform Badge */}
                        <div className="relative mb-3">
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt={username}
                              className="w-16 h-16 rounded-full object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
                              {channel.accountName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Instagram badge at bottom */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center p-1 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white ring-2 ring-background">
                            <InstagramIcon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Username */}
                        <span className="font-medium text-sm truncate max-w-full">
                          {username}
                        </span>
                        {displayName && (
                          <span className="text-xs text-muted-foreground truncate max-w-full">
                            {displayName}
                          </span>
                        )}

                        {/* Options menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {removingChannelId === channel.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => window.open(profileUrl, "_blank")}
                              className="gap-2 cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveChannel(channel.id)}
                              disabled={removingChannelId === channel.id}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Status indicator */}
                        <div
                          className={`absolute top-2 left-2 w-2 h-2 rounded-full ${
                            channel.isActive ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          title={channel.isActive ? "Active" : "Paused"}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
