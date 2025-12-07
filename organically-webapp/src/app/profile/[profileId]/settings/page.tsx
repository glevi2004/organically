"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateProfile,
  disconnectSocialAccount,
} from "@/services/profileService";
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
import { ExternalLink, Unlink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TwitterConnection } from "@/types/profile";

export default function SettingsPage() {
  const { activeProfile, refreshProfiles } = useProfile();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // General settings
  const [name, setName] = useState(activeProfile?.name || "");

  // Handle OAuth callback messages
  useEffect(() => {
    const twitterStatus = searchParams.get("twitter");
    const error = searchParams.get("error");

    const handleTwitterPending = async () => {
      if (twitterStatus === "pending" && activeProfile) {
        // Read the Twitter data from cookie
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith("twitter_connection_data="));

        if (cookieValue) {
          try {
            const twitterData = JSON.parse(
              decodeURIComponent(cookieValue.split("=")[1])
            );

            // Save to Firestore using client SDK (user is authenticated)
            await updateProfile(activeProfile.id, {
              socialConnections: {
                ...activeProfile.socialConnections,
                twitter: twitterData,
              },
            } as any);

            // Delete the cookie
            document.cookie =
              "twitter_connection_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            // Refresh and show success
            await refreshProfiles();
            toast.success("X (Twitter) account connected successfully!");
          } catch (err) {
            console.error("Error saving Twitter connection:", err);
            toast.error("Failed to save X connection");
          }
        }

        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      } else if (twitterStatus === "connected") {
        toast.success("X (Twitter) account connected successfully!");
        window.history.replaceState({}, "", window.location.pathname);
        refreshProfiles();
      } else if (error) {
        const errorMessages: Record<string, string> = {
          twitter_denied: "X authorization was denied",
          twitter_missing_params: "Missing authorization parameters",
          twitter_session_expired: "Session expired, please try again",
          twitter_missing_profile: "Profile not found",
          twitter_missing_user: "User authentication required",
          twitter_csrf_error: "Security validation failed, please try again",
          twitter_unauthorized:
            "You don't have permission to connect this profile",
          twitter_profile_not_found: "Profile not found",
          twitter_callback_failed: "Failed to connect X account",
        };
        toast.error(errorMessages[error] || "An error occurred");
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    handleTwitterPending();
  }, [searchParams, refreshProfiles, activeProfile]);

  // Get Twitter connection status
  const twitterConnection = activeProfile?.socialConnections?.twitter as
    | TwitterConnection
    | undefined;

  const handleSaveGeneral = async () => {
    if (!activeProfile || !name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(activeProfile.id, { name: name.trim() });
      await refreshProfiles();
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Connect to X (Twitter)
  const handleConnectTwitter = () => {
    if (!activeProfile) {
      toast.error("No active profile");
      return;
    }
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    // Redirect to OAuth flow with profileId and userId for ownership validation
    window.location.href = `/api/auth/twitter?profileId=${activeProfile.id}&userId=${user.uid}`;
  };

  // Disconnect Twitter
  const handleDisconnectTwitter = async () => {
    if (!activeProfile) return;

    setDisconnecting(true);
    try {
      await disconnectSocialAccount(activeProfile.id, "twitter");
      await refreshProfiles();
      toast.success("X (Twitter) account disconnected");
    } catch (error) {
      console.error("Error disconnecting Twitter:", error);
      toast.error("Failed to disconnect X account");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile settings and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your profile name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Integrations</CardTitle>
              <CardDescription>
                Connect your social media accounts to enable automated posting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* X (Twitter) Integration */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black dark:bg-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-white dark:text-black"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">X (Twitter)</h3>
                    {twitterConnection ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Connected as @{twitterConnection.screenName}
                        </span>
                        {twitterConnection.name && (
                          <span className="text-muted-foreground/60">
                            ({twitterConnection.name})
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Post tweets automatically from your scheduled content
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {twitterConnection ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://x.com/${twitterConnection.screenName}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnectTwitter}
                        disabled={disconnecting}
                      >
                        {disconnecting ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4 mr-1" />
                        )}
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleConnectTwitter}
                      className="bg-black hover:bg-black/90 dark:bg-white dark:hover:bg-white/90 dark:text-black"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Connect X Account
                    </Button>
                  )}
                </div>
              </div>

              {/* Instagram Integration (Coming Soon) */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border opacity-60">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Instagram</h3>
                    <p className="text-sm text-muted-foreground">
                      Coming soon - Post to Instagram Business accounts
                    </p>
                  </div>
                </div>
                <Button disabled variant="outline">
                  Coming Soon
                </Button>
              </div>

              {/* TikTok Integration (Coming Soon) */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border opacity-60">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">TikTok</h3>
                    <p className="text-sm text-muted-foreground">
                      Coming soon - Publish videos to TikTok
                    </p>
                  </div>
                </div>
                <Button disabled variant="outline">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
