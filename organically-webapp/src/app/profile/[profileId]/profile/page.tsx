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
import { Card, CardContent } from "@/components/ui/card";
import { Check, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  PLATFORMS,
  CONSISTENCY_LEVELS,
  AGE_RANGES,
  GENDERS,
  CONTENT_TYPES,
  NICHES,
} from "@/lib/profile-constants";

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
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState<string[]>([]);
  const [brandVoice, setBrandVoice] = useState("");
  const [valuesMission, setValuesMission] = useState("");

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
      setDescription(activeProfile.description || "");
      setNiche(activeProfile.niche || []);
      setBrandVoice(activeProfile.brandVoice || "");
      setValuesMission(activeProfile.valuesMission || "");
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
        JSON.stringify(activeProfile.contentTypes || []) ||
      description !== (activeProfile.description || "") ||
      JSON.stringify(niche) !== JSON.stringify(activeProfile.niche || []) ||
      brandVoice !== (activeProfile.brandVoice || "") ||
      valuesMission !== (activeProfile.valuesMission || "");

    setHasChanges(changed);
  }, [
    name,
    imageFile,
    platforms,
    consistencyLevel,
    ageRanges,
    genders,
    contentTypes,
    description,
    niche,
    brandVoice,
    valuesMission,
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
        description: description.trim() || undefined,
        niche: niche.length > 0 ? niche : undefined,
        brandVoice: brandVoice.trim() || undefined,
        valuesMission: valuesMission.trim() || undefined,
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
      setDescription(activeProfile.description || "");
      setNiche(activeProfile.niche || []);
      setBrandVoice(activeProfile.brandVoice || "");
      setValuesMission(activeProfile.valuesMission || "");
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
      {/* VIEW MODE */}
      {!isEditing && (
        <div className="flex justify-center">
          <Card className="w-full max-w-3xl">
            <CardContent className="p-8 space-y-6">
              {/* Profile Image, Name & Description */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentImageUrl} alt={activeProfile.name} />
                  <AvatarFallback className="text-2xl">
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{name}</h2>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                  {description && (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {description}
                    </p>
                  )}
                  {/* Niches & Consistency */}
                  {(niche.length > 0 || (consistency && consistencyLevel)) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {niche.map((nicheId) => {
                        const nicheItem = NICHES.find((n) => n.id === nicheId);
                        return (
                          <span
                            key={nicheId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-sm font-medium"
                          >
                            {nicheItem?.icon} {nicheItem?.label}
                          </span>
                        );
                      })}
                      {consistency && consistencyLevel && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-sm font-medium">
                          {consistency.icon} {consistency.name} (
                          {
                            CONSISTENCY_LEVELS.find(
                              (l) => l.id === consistencyLevel
                            )!.frequency
                          }
                          )
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional metadata section */}
              <div className="space-y-2">
                {/* Platforms */}
                {platforms.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-muted-foreground">Platforms:</span>
                    {platforms.map((platformId, index) => {
                      const platform = PLATFORMS.find(
                        (p) => p.id === platformId
                      );
                      return (
                        <span
                          key={platformId}
                          className="inline-flex items-center gap-1"
                        >
                          {platform?.logo && (
                            <Image
                              src={platform.logo}
                              alt={platform.name}
                              width={16}
                              height={16}
                              className="shrink-0"
                            />
                          )}
                          <span className="text-foreground">
                            {platform?.name}
                          </span>
                          {index < platforms.length - 1 && (
                            <span className="text-muted-foreground">,</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Target Audience */}
                {(ageRanges.length > 0 || genders.length > 0) && (
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-muted-foreground">Audience:</span>
                    {ageRanges.map((ageId, index) => {
                      const age = AGE_RANGES.find((a) => a.id === ageId);
                      return (
                        <span
                          key={ageId}
                          className="inline-flex items-center gap-1"
                        >
                          <span>{age?.icon}</span>
                          <span className="text-foreground">{age?.label}</span>
                          {(index < ageRanges.length - 1 ||
                            genders.length > 0) && (
                            <span className="text-muted-foreground">,</span>
                          )}
                        </span>
                      );
                    })}
                    {genders.map((genderId, index) => {
                      const gender = GENDERS.find((g) => g.id === genderId);
                      return (
                        <span
                          key={genderId}
                          className="inline-flex items-center gap-1"
                        >
                          <span>{gender?.icon}</span>
                          <span className="text-foreground">
                            {gender?.label}
                          </span>
                          {index < genders.length - 1 && (
                            <span className="text-muted-foreground">,</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Content Types */}
                {contentTypes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-muted-foreground">Content:</span>
                    {contentTypes.map((typeId, index) => {
                      const type = CONTENT_TYPES.find((t) => t.id === typeId);
                      return (
                        <span
                          key={typeId}
                          className="inline-flex items-center gap-1"
                        >
                          <span>{type?.icon}</span>
                          <span className="text-foreground">{type?.label}</span>
                          {index < contentTypes.length - 1 && (
                            <span className="text-muted-foreground">,</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <>
          {/* Header Actions */}
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
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
          </div>
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
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description / Bio</Label>
                <p className="text-sm text-muted-foreground">
                  Describe your brand or personal profile in 200-500 characters
                </p>
              </div>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your brand or personal profile..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
                {description.length > 0 && description.length < 200 && (
                  <p className="text-xs text-amber-600">
                    Minimum 200 characters recommended
                  </p>
                )}
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

            {/* Niche */}
            <div className="space-y-4">
              <div>
                <Label>Niche / Category</Label>
                <p className="text-sm text-muted-foreground">
                  Select one or more categories that best describe your content
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {NICHES.map((nicheItem) => (
                  <button
                    key={nicheItem.id}
                    type="button"
                    onClick={() => toggleItem(niche, nicheItem.id, setNiche)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      niche.includes(nicheItem.id)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-xl">{nicheItem.icon}</span>
                    <span className="text-sm font-medium">
                      {nicheItem.label}
                    </span>
                    {niche.includes(nicheItem.id) && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Voice */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="brandVoice">Brand Voice / Tone</Label>
                <p className="text-sm text-muted-foreground">
                  Describe your brand's voice and tone in 200-500 characters
                </p>
              </div>
              <textarea
                id="brandVoice"
                rows={4}
                placeholder="How do you want to communicate with your audience?"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {brandVoice.length}/500 characters
                </p>
                {brandVoice.length > 0 && brandVoice.length < 200 && (
                  <p className="text-xs text-amber-600">
                    Minimum 200 characters recommended
                  </p>
                )}
              </div>
            </div>

            {/* Values / Mission */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="valuesMission">Values / Mission</Label>
                <p className="text-sm text-muted-foreground">
                  Describe your brand's values and mission in 200-500 characters
                </p>
              </div>
              <textarea
                id="valuesMission"
                rows={4}
                placeholder="What drives you and what do you stand for?"
                value={valuesMission}
                onChange={(e) => setValuesMission(e.target.value)}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {valuesMission.length}/500 characters
                </p>
                {valuesMission.length > 0 && valuesMission.length < 200 && (
                  <p className="text-xs text-amber-600">
                    Minimum 200 characters recommended
                  </p>
                )}
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
                          newGenders = newGenders.filter(
                            (g) => g !== gender.id
                          );
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
        </>
      )}
    </div>
  );
}
