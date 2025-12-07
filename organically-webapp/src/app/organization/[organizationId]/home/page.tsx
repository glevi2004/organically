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
  Lightbulb,
  Calendar,
  FileEdit,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { getDefaultOrganizationImageUrl } from "@/services/imageUploadService";
import { getPostsByOrganization } from "@/services/postService";
import { getIdeasByOrganization } from "@/services/ideaService";
import { Post } from "@/types/post";
import { Idea } from "@/types/idea";
import Image from "next/image";
import { PLATFORMS } from "@/lib/organization-constants";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!activeOrganization) return;

    try {
      setLoading(true);
      const [allPosts, allIdeas] = await Promise.all([
        getPostsByOrganization(activeOrganization.id),
        getIdeasByOrganization(activeOrganization.id),
      ]);

      setPosts(allPosts);
      setIdeas(allIdeas);
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

  // Get today's tasks (posts scheduled for today)
  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return posts.filter((post) => {
      if (!post.scheduledDate) return false;
      const postDate = new Date(post.scheduledDate);
      return (
        postDate >= today && postDate < tomorrow && post.status !== "posted"
      );
    });
  };

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

  // Calculate streak (posts in last 7 days)
  const calculateStreak = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return posts.filter((post) => {
      if (!post.postedDate) return false;
      const postDate = new Date(post.postedDate);
      return postDate >= weekAgo && post.status === "posted";
    }).length;
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return platform?.logo;
  };

  const todaysTasks = getTodaysTasks();
  const upcomingPosts = getUpcomingPosts();
  const streak = calculateStreak();
  const totalPosts = posts.length;
  const totalIdeas = ideas.length;
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                        Saved Ideas
                      </p>
                      <p className="text-3xl font-bold">{totalIdeas}</p>
                    </div>
                    <Lightbulb className="w-8 h-8 text-muted-foreground" />
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

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        7-Day Streak
                      </p>
                      <p className="text-3xl font-bold">{streak}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No posts scheduled for today. Ready to create something?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() =>
                          router.push(`/organization/${activeOrganization?.id}/idea-dump`)
                        }
                        variant="outline"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Generate Ideas
                      </Button>
                      <Button
                        onClick={() =>
                          router.push(`/organization/${activeOrganization?.id}/calendar`)
                        }
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Weekly Plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysTasks.map((task) => {
                      const firstPlatform = task.platforms?.[0];
                      const platformLogo = firstPlatform
                        ? getPlatformIcon(firstPlatform)
                        : null;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/organization/${activeOrganization?.id}/posts`)
                          }
                        >
                          {platformLogo && (
                            <Image
                              src={platformLogo}
                              alt={firstPlatform || "Platform"}
                              width={24}
                              height={24}
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {firstPlatform
                                ? firstPlatform.charAt(0).toUpperCase() +
                                  firstPlatform.slice(1)
                                : "Multiple platforms"}{" "}
                              •{" "}
                              {task.status.charAt(0).toUpperCase() +
                                task.status.slice(1)}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Posts */}
            {upcomingPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                            <p className="text-sm font-medium">{post.title}</p>
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
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
