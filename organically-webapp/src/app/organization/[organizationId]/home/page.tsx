"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { OnboardingPrompt } from "@/components/organization/OnboardingPrompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Calendar,
  FileEdit,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getDefaultOrganizationImageUrl } from "@/services/imageUploadService";
import { getPostsByOrganization } from "@/services/postService";
import { Post } from "@/types/post";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!activeOrganization) return;

    try {
      setLoading(true);
      const allPosts = await getPostsByOrganization(activeOrganization.id);
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  // Load data
  useEffect(() => {
    if (activeOrganization) {
      loadDashboardData();
    }
  }, [activeOrganization, loadDashboardData]);

  // Get upcoming posts (next 7 days)
  const getUpcomingPosts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return posts
      .filter((post) => {
        if (!post.scheduledDate) return false;
        const postDate = new Date(post.scheduledDate);
        return (
          postDate >= today && postDate < nextWeek && post.status !== "posted"
        );
      })
      .slice(0, 5);
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.logo;
  };

  const upcomingPosts = getUpcomingPosts();
  const totalPosts = posts.length;
  const channels = activeOrganization?.channels?.length || 0;

  return (
    <div className="relative overflow-hidden">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Onboarding Prompt */}
        {activeOrganization && !activeOrganization.onboardingCompleted && (
          <OnboardingPrompt
            organizationId={activeOrganization.id}
            currentStep={activeOrganization.onboardingStep || 1}
            totalSteps={5}
          />
        )}

        {/* Welcome Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={activeOrganization?.imageUrl || getDefaultOrganizationImageUrl()}
              alt={activeOrganization?.name || "Organization"}
            />
            <AvatarFallback className="text-2xl">
              {activeOrganization?.name?.charAt(0).toUpperCase() || "O"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {activeOrganization?.name}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your content today
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Posts
                      </p>
                      <p className="text-3xl font-bold">{totalPosts}</p>
                    </div>
                    <FileEdit className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Channels
                      </p>
                      <p className="text-3xl font-bold">{channels}</p>
                    </div>
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming This Week */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No posts scheduled this week. Ready to create something?
                    </p>
                    <Button
                      onClick={() =>
                        router.push(`/organization/${activeOrganization?.id}/calendar`)
                      }
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Weekly Plan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingPosts.map((post) => {
                      const firstPlatform = post.platforms?.[0];
                      const platformLogo = firstPlatform
                        ? getPlatformIcon(firstPlatform)
                        : null;
                      return (
                        <div
                          key={post.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/organization/${activeOrganization?.id}/posts`)
                          }
                        >
                          {platformLogo && (
                            <Image
                              src={platformLogo}
                              alt={firstPlatform || "Platform"}
                              width={20}
                              height={20}
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{post.content || "Untitled post"}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.scheduledDate &&
                                new Date(post.scheduledDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              post.status === "ready"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            }`}
                          >
                            {post.status.charAt(0).toUpperCase() +
                              post.status.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
