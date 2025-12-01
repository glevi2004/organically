"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profileService";
import { uploadProfileImage } from "@/services/imageUploadService";
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
import { ImageUpload } from "@/components/ui/image-upload";
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
  { id: "casual", label: "Casual Cruiser", description: "~3 posts/week" },
  { id: "steady", label: "Steady Grinder", description: "1-2 posts/day" },
  {
    id: "aggressive",
    label: "Algorithm Soldier",
    description: "3-6 posts/day",
  },
];

const AGE_RANGES = [
  { id: "gen_z", label: "Gen Z", description: "13–28" },
  { id: "millennials", label: "Millennials", description: "29–44" },
  { id: "gen_x", label: "Gen X", description: "45–60" },
  { id: "boomers", label: "Boomers", description: "61–79" },
];

const GENDERS = [
  { id: "all", label: "All genders" },
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

const CONTENT_TYPES = [
  { id: "short_form_video", label: "Short-form video", icon: "📱" },
  { id: "long_form_video", label: "Long-form video", icon: "🎬" },
  { id: "stories", label: "Stories", icon: "📖" },
  { id: "carousels", label: "Carousels", icon: "🎠" },
  { id: "text_posts", label: "Text posts / Threads", icon: "📝" },
  { id: "podcasts", label: "Podcasts", icon: "🎙️" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { activeProfile, refreshProfiles } = useProfile();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    undefined
  );
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [consistencyLevel, setConsistencyLevel] = useState("");
  const [ageRanges, setAgeRanges] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);

  // Load profile data
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name || "");
      setCurrentImageUrl(activeProfile.imageUrl);
      setPlatforms(activeProfile.platforms || []);
      setConsistencyLevel(activeProfile.consistencyLevel || "");
      setAgeRanges(activeProfile.targetAudience?.ageRanges || []);
      setGenders(activeProfile.targetAudience?.genders || []);
      setContentTypes(activeProfile.contentTypes || []);
    }
  }, [activeProfile]);

  // Track changes
  useEffect(() => {
    if (!activeProfile) return;

    const changed =
      name !== (activeProfile.name || "") ||
      imageFile !== null ||
      JSON.stringify(platforms) !==
        JSON.stringify(activeProfile.platforms || []) ||
      consistencyLevel !== (activeProfile.consistencyLevel || "") ||
      JSON.stringify(ageRanges) !==
        JSON.stringify(activeProfile.targetAudience?.ageRanges || []) ||
      JSON.stringify(genders) !==
        JSON.stringify(activeProfile.targetAudience?.genders || []) ||
      JSON.stringify(contentTypes) !==
        JSON.stringify(activeProfile.contentTypes || []);

    setHasChanges(changed);
  }, [
    name,
    imageFile,
    platforms,
    consistencyLevel,
    ageRanges,
    genders,
    contentTypes,
    activeProfile,
  ]);

  const handleSave = async () => {
    if (!activeProfile || !user || !name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setSaving(true);
    try {
      let newImageUrl = currentImageUrl;

      // Upload new image if file selected
      if (imageFile) {
        newImageUrl = await uploadProfileImage(
          user.uid,
          activeProfile.id,
          imageFile
        );
      }

      // Update profile with all changes
      await updateProfile(activeProfile.id, {
        name: name.trim(),
        imageUrl: newImageUrl,
        platforms,
        consistencyLevel: consistencyLevel as any,
        targetAudience: { ageRanges, genders },
        contentTypes,
      });

      await refreshProfiles();
      setImageFile(null);
      setHasChanges(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your content profile and preferences
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Basic information about your content profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <ImageUpload
              value={imageFile || currentImageUrl}
              onChange={(file) => setImageFile(file)}
              placeholder="Upload a profile image"
            />
          </div>

          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="e.g., Personal Brand, Startup, Agency"
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          {/* Profile ID & Created Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Profile ID
              </Label>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {activeProfile.id}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm p-2">
                {new Date(
                  activeProfile.createdAt.toDate()
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platforms Card */}
      <Card>
        <CardHeader>
          <CardTitle>Platforms</CardTitle>
          <CardDescription>
            Select the platforms you want to grow on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => toggleItem(platforms, platform.id, setPlatforms)}
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
        </CardContent>
      </Card>

      {/* Consistency Level Card */}
      <Card>
        <CardHeader>
          <CardTitle>Consistency Level</CardTitle>
          <CardDescription>How often do you want to post?</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <div>
                    <span className="font-medium block">{level.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {level.description}
                    </span>
                  </div>
                  {consistencyLevel === level.id && (
                    <Check className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Audience Card */}
      <Card>
        <CardHeader>
          <CardTitle>Target Audience</CardTitle>
          <CardDescription>
            Define who you're creating content for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Ranges */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Age Ranges</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AGE_RANGES.map((age) => (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => toggleItem(ageRanges, age.id, setAgeRanges)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    ageRanges.includes(age.id)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-medium">{age.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {age.description}
                    </span>
                    {ageRanges.includes(age.id) && (
                      <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Genders */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Genders</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        newGenders = newGenders.filter((g) => g !== gender.id);
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
                    <span className="text-sm font-medium">{gender.label}</span>
                    {genders.includes(gender.id) && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Types Card */}
      <Card>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>
            Select the types of content you create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  toggleItem(contentTypes, type.id, setContentTypes)
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  contentTypes.includes(type.id)
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm font-medium flex-1 text-left">
                    {type.label}
                  </span>
                  {contentTypes.includes(type.id) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
