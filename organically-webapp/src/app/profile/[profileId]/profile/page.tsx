"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profileService";
import { uploadProfileImage } from "@/services/imageUploadService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", logo: "/logos/instagram.svg" },
  { id: "tiktok", name: "TikTok", logo: "/logos/tiktok.svg" },
  { id: "youtube", name: "YouTube", logo: "/logos/youtube.svg" },
  { id: "x", name: "X (Twitter)", logo: "/logos/x.svg" },
  { id: "linkedin", name: "LinkedIn", logo: "/logos/linkedin.svg" },
];

const CONSISTENCY_LEVELS = [
  {
    id: "casual",
    name: "Casual Cruiser",
    description: "Grow with minimal effort — chill pace, zero overwhelm.",
    frequency: "~3 posts/week",
    growth: "⭐ Slow",
    bestFor: "Busy people who want gentle, low-pressure consistency.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "steady",
    name: "Steady Grinder",
    description: "Steady, creator-mode posting with real momentum.",
    frequency: "1–2 posts/day",
    growth: "⭐⭐ Moderate–Fast",
    bestFor:
      "People who want predictable growth and are ready to show up regularly.",
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "aggressive",
    name: "Algorithm Soldier",
    description: "Go all-in, post aggressively, and maximize reach everywhere.",
    frequency: "3–6 posts/day",
    growth: "⭐⭐⭐ Very Fast",
    bestFor:
      "Launch mode, startups, or anyone grinding like the algorithm owes them money.",
    color: "from-orange-500 to-red-600",
  },
];

const AGE_RANGES = [
  { id: "gen_z", label: "Gen Z (13–28)", icon: "🎮" },
  { id: "millennials", label: "Millennials (29–44)", icon: "💼" },
  { id: "gen_x", label: "Gen X (45–60)", icon: "📚" },
  { id: "boomers", label: "Boomers (61–79)", icon: "🏡" },
];

const GENDERS = [
  { id: "all", label: "All genders", icon: "🌍" },
  { id: "male", label: "Male", icon: "👨" },
  { id: "female", label: "Female", icon: "👩" },
  { id: "other", label: "Other", icon: "🌈" },
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
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [showConsistencyDetails, setShowConsistencyDetails] = useState(false);

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
      setIsEditingImage(false);
      setIsEditing(false);
      setHasChanges(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (activeProfile) {
      setName(activeProfile.name || "");
      setCurrentImageUrl(activeProfile.imageUrl);
      setPlatforms(activeProfile.platforms || []);
      setConsistencyLevel(activeProfile.consistencyLevel || "");
      setAgeRanges(activeProfile.targetAudience?.ageRanges || []);
      setGenders(activeProfile.targetAudience?.genders || []);
      setContentTypes(activeProfile.contentTypes || []);
    }
    setImageFile(null);
    setIsEditingImage(false);
    setIsEditing(false);
    setHasChanges(false);
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

  // Get consistency level display data
  const getConsistencyDisplay = () => {
    const level = CONSISTENCY_LEVELS.find((l) => l.id === consistencyLevel);
    if (!level) return null;
    return {
      icon: level.id === "casual" ? "😎" : level.id === "steady" ? "💪" : "🔥",
      name: level.name,
    };
  };

  const consistency = getConsistencyDisplay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            {isEditing
              ? "Edit your content profile and preferences"
              : "View your content profile"}
          </p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" disabled={saving}>
              Cancel
            </Button>
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
        )}
      </div>

      {/* VIEW MODE */}
      {!isEditing && (
        <div className="space-y-8">
          {/* Profile Image & Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentImageUrl} alt={activeProfile.name} />
              <AvatarFallback className="text-2xl">
                {activeProfile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">
                Created{" "}
                {new Date(
                  activeProfile.createdAt.toDate()
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Platforms</h3>
                <p className="text-sm text-muted-foreground">
                  The platforms you're growing on
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {platforms.map((platformId) => {
                  const platform = PLATFORMS.find((p) => p.id === platformId);
                  return (
                    <div
                      key={platformId}
                      className="p-3 rounded-lg border-2 border-border bg-muted/30 flex items-center gap-2"
                    >
                      {platform?.logo && (
                        <Image
                          src={platform.logo}
                          alt={platform.name}
                          width={20}
                          height={20}
                          className="shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {platform?.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consistency Level */}
          {consistency && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Consistency Level</h3>
                <p className="text-sm text-muted-foreground">
                  Your posting commitment level
                </p>
              </div>
              {consistency && consistencyLevel && (
                <div className="p-3 rounded-lg border-2 border-border bg-muted/30 flex items-center gap-3">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg bg-linear-to-br ${
                      consistencyLevel === "casual"
                        ? "from-blue-500 to-cyan-500"
                        : consistencyLevel === "steady"
                        ? "from-emerald-500 to-green-600"
                        : "from-orange-500 to-red-600"
                    } flex items-center justify-center text-white font-bold text-base`}
                  >
                    <span>{consistency.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {consistency.name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {
                        CONSISTENCY_LEVELS.find(
                          (l) => l.id === consistencyLevel
                        )!.frequency
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {
                        CONSISTENCY_LEVELS.find(
                          (l) => l.id === consistencyLevel
                        )!.growth
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target Audience */}
          {(ageRanges.length > 0 || genders.length > 0) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Target Audience</h3>
                <p className="text-sm text-muted-foreground">
                  Who you're creating content for
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {ageRanges.map((ageId) => {
                  const age = AGE_RANGES.find((a) => a.id === ageId);
                  return (
                    <div
                      key={ageId}
                      className="p-3 rounded-lg border-2 border-border bg-muted/30 flex items-center gap-2"
                    >
                      <span className="text-xl">{age?.icon}</span>
                      <span className="text-sm font-medium">{age?.label}</span>
                    </div>
                  );
                })}
                {genders.map((genderId) => {
                  const gender = GENDERS.find((g) => g.id === genderId);
                  return (
                    <div
                      key={genderId}
                      className="p-3 rounded-lg border-2 border-border bg-muted/30 flex items-center gap-2"
                    >
                      <span className="text-xl">{gender?.icon}</span>
                      <span className="text-sm font-medium">
                        {gender?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Types */}
          {contentTypes.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Content Types</h3>
                <p className="text-sm text-muted-foreground">
                  The types of content you create
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {contentTypes.map((typeId) => {
                  const type = CONTENT_TYPES.find((t) => t.id === typeId);
                  return (
                    <div
                      key={typeId}
                      className="p-3 rounded-lg border-2 border-border bg-muted/30 flex items-center gap-2"
                    >
                      <span className="text-xl">{type?.icon}</span>
                      <span className="text-sm font-medium">{type?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <div className="space-y-8">
          {/* Profile Image & Name */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Upload - Left Side */}
            <div>
              {!isEditingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={currentImageUrl}
                      alt={activeProfile.name}
                    />
                    <AvatarFallback className="text-2xl">
                      {activeProfile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingImage(true)}
                  >
                    Edit Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageUpload
                    value={imageFile || currentImageUrl}
                    onChange={(file) => {
                      setImageFile(file);
                      if (!file) {
                        setIsEditingImage(false);
                      }
                    }}
                    placeholder="Upload a profile image"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingImage(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Details - Right Side */}
            <div className="flex-1 space-y-4">
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

              {/* Created Date */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {new Date(
                    activeProfile.createdAt.toDate()
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Platforms</h3>
              <p className="text-sm text-muted-foreground">
                Select the platforms you want to grow on
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() =>
                    toggleItem(platforms, platform.id, setPlatforms)
                  }
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    platforms.includes(platform.id)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    width={20}
                    height={20}
                    className="shrink-0"
                  />
                  <span className="text-sm font-medium">{platform.name}</span>
                  {platforms.includes(platform.id) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Consistency Level */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Consistency Level</h3>
              <p className="text-sm text-muted-foreground">
                Choose your posting commitment level. You can always adjust
                later.
              </p>
            </div>
            <div className="space-y-3">
              {CONSISTENCY_LEVELS.map((level) => {
                const isSelected = consistencyLevel === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setShowConsistencyDetails(!showConsistencyDetails);
                      } else {
                        setConsistencyLevel(level.id);
                        setShowConsistencyDetails(true);
                      }
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-lg bg-linear-to-br ${level.color} flex items-center justify-center text-white font-bold text-base`}
                      >
                        {level.id === "casual"
                          ? "😎"
                          : level.id === "steady"
                          ? "💪"
                          : "🔥"}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {level.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {level.frequency}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {level.growth}
                            </span>
                          </div>
                          {isSelected &&
                            (showConsistencyDetails ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ))}
                        </div>

                        {/* Expanded Details Inside Button */}
                        {isSelected && showConsistencyDetails && (
                          <div className="space-y-2 pt-1">
                            <p className="text-sm text-foreground">
                              {level.description}
                            </p>
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Best for:
                              </span>
                              <span className="ml-1">{level.bestFor}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Target Audience</h3>
              <p className="text-sm text-muted-foreground">
                Define who you're creating content for
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {AGE_RANGES.map((age) => (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => toggleItem(ageRanges, age.id, setAgeRanges)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    ageRanges.includes(age.id)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  <span className="text-xl">{age.icon}</span>
                  <span className="text-sm font-medium">{age.label}</span>
                  {ageRanges.includes(age.id) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
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
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    genders.includes(gender.id)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  <span className="text-xl">{gender.icon}</span>
                  <span className="text-sm font-medium">{gender.label}</span>
                  {genders.includes(gender.id) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Content Types</h3>
              <p className="text-sm text-muted-foreground">
                Select the types of content you create
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    toggleItem(contentTypes, type.id, setContentTypes)
                  }
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    contentTypes.includes(type.id)
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                  {contentTypes.includes(type.id) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button (Bottom) */}
          {hasChanges && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                disabled={saving}
              >
                Cancel
              </Button>
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
      )}
    </div>
  );
}
