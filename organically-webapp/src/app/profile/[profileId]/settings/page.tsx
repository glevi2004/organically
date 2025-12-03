"use client";

import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { updateProfile } from "@/services/profileService";
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
import { Check } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "x", name: "X (Twitter)", icon: "✖️" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "threads", name: "Threads", icon: "🧵" },
];

const CONSISTENCY_LEVELS = [
  { id: "casual", label: "Casual Cruiser (~3 posts/week)" },
  { id: "steady", label: "Steady Grinder (1-2 posts/day)" },
  { id: "aggressive", label: "Algorithm Soldier (3-6 posts/day)" },
];

const AGE_RANGES = [
  { id: "gen_z", label: "Gen Z (13–28)" },
  { id: "millennials", label: "Millennials (29–44)" },
  { id: "gen_x", label: "Gen X (45–60)" },
  { id: "boomers", label: "Boomers (61–79)" },
];

const GENDERS = [
  { id: "all", label: "All genders" },
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

const CONTENT_TYPES = [
  { id: "short_form_video", label: "Short-form video" },
  { id: "long_form_video", label: "Long-form video" },
  { id: "stories", label: "Stories" },
  { id: "carousels", label: "Carousels" },
  { id: "text_posts", label: "Text posts / Threads" },
  { id: "podcasts", label: "Podcasts" },
];

export default function SettingsPage() {
  const { activeProfile, refreshProfiles } = useProfile();
  const [saving, setSaving] = useState(false);

  // General settings
  const [name, setName] = useState(activeProfile?.name || "");

  // Platforms
  const [platforms, setPlatforms] = useState<string[]>(
    activeProfile?.platforms || []
  );

  // Consistency
  const [consistencyLevel, setConsistencyLevel] = useState(
    activeProfile?.consistencyLevel || ""
  );

  // Audience
  const [ageRanges, setAgeRanges] = useState<string[]>(
    activeProfile?.targetAudience?.ageRanges || []
  );
  const [genders, setGenders] = useState<string[]>(
    activeProfile?.targetAudience?.genders || []
  );

  // Content Types
  const [contentTypes, setContentTypes] = useState<string[]>(
    activeProfile?.contentTypes || []
  );

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

  const handleSavePlatforms = async () => {
    if (!activeProfile) return;

    setSaving(true);
    try {
      await updateProfile(activeProfile.id, { platforms });
      await refreshProfiles();
      toast.success("Platforms updated successfully!");
    } catch (error) {
      console.error("Error updating platforms:", error);
      toast.error("Failed to update platforms");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsistency = async () => {
    if (!activeProfile || !consistencyLevel) {
      toast.error("Please select a consistency level");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(activeProfile.id, {
        consistencyLevel: consistencyLevel as any,
      });
      await refreshProfiles();
      toast.success("Consistency level updated successfully!");
    } catch (error) {
      console.error("Error updating consistency:", error);
      toast.error("Failed to update consistency");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAudience = async () => {
    if (!activeProfile) return;

    setSaving(true);
    try {
      await updateProfile(activeProfile.id, {
        targetAudience: { ageRanges, genders },
      });
      await refreshProfiles();
      toast.success("Audience updated successfully!");
    } catch (error) {
      console.error("Error updating audience:", error);
      toast.error("Failed to update audience");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContentTypes = async () => {
    if (!activeProfile) return;

    setSaving(true);
    try {
      await updateProfile(activeProfile.id, { contentTypes });
      await refreshProfiles();
      toast.success("Content types updated successfully!");
    } catch (error) {
      console.error("Error updating content types:", error);
      toast.error("Failed to update content types");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (
    items: string[],
    item: string,
    setItems: (items: string[]) => void
  ) => {
    if (items.includes(item)) {
      setItems(items.filter((i) => i !== item));
    } else {
      setItems([...items, item]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="consistency">Consistency</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content Types</TabsTrigger>
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

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
              <CardDescription>
                Select the platforms you want to grow on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() =>
                      toggleItem(platforms, platform.id, setPlatforms)
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      platforms.includes(platform.id)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                      {platforms.includes(platform.id) && (
                        <Check className="ml-auto w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSavePlatforms}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consistency Tab */}
        <TabsContent value="consistency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consistency Level</CardTitle>
              <CardDescription>How often do you want to post?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {CONSISTENCY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setConsistencyLevel(level.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      consistencyLevel === level.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{level.label}</span>
                      {consistencyLevel === level.id && (
                        <Check className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSaveConsistency}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Define who you're creating content for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Age Ranges</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AGE_RANGES.map((age) => (
                    <button
                      key={age.id}
                      type="button"
                      onClick={() =>
                        toggleItem(ageRanges, age.id, setAgeRanges)
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        ageRanges.includes(age.id)
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{age.label}</span>
                        {ageRanges.includes(age.id) && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Genders</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender.id}
                      type="button"
                      onClick={() => {
                        if (gender.id === "all") {
                          setGenders(genders.includes("all") ? [] : ["all"]);
                        } else {
                          let newGenders = genders.filter((g) => g !== "all");
                          if (newGenders.includes(gender.id)) {
                            newGenders = newGenders.filter(
                              (g) => g !== gender.id
                            );
                          } else {
                            newGenders = [...newGenders, gender.id];
                          }
                          setGenders(newGenders);
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        genders.includes(gender.id)
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {gender.label}
                        </span>
                        {genders.includes(gender.id) && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveAudience}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Types Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
              <CardDescription>
                Select the types of content you create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      toggleItem(contentTypes, type.id, setContentTypes)
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentTypes.includes(type.id)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type.label}</span>
                      {contentTypes.includes(type.id) && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSaveContentTypes}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
