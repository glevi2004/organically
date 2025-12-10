"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateOrganization } from "@/services/organizationService";
import { uploadOrganizationImage } from "@/services/imageUploadService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationPage() {
  const { user } = useAuth();
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    undefined
  );
  const [description, setDescription] = useState("");

  // Load organization data
  useEffect(() => {
    if (activeOrganization) {
      setName(activeOrganization.name || "");
      setCurrentImageUrl(activeOrganization.imageUrl);
      setDescription(activeOrganization.description || "");
    }
  }, [activeOrganization]);

  // Track changes
  useEffect(() => {
    if (!activeOrganization) return;

    const changed =
      name !== (activeOrganization.name || "") ||
      imageFile !== null ||
      description !== (activeOrganization.description || "");

    setHasChanges(changed);
  }, [name, imageFile, description, activeOrganization]);

  const handleSave = async () => {
    if (!activeOrganization || !user || !name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setSaving(true);
    try {
      let newImageUrl = currentImageUrl;

      // Upload new image if file selected
      if (imageFile) {
        newImageUrl = await uploadOrganizationImage(
          user.uid,
          activeOrganization.id,
          imageFile
        );
      }

      // Update organization with all changes
      await updateOrganization(activeOrganization.id, {
        name: name.trim(),
        imageUrl: newImageUrl,
        description: description.trim() || undefined,
      });

      await refreshOrganizations();
      setImageFile(null);
      setIsEditingImage(false);
      setIsEditing(false);
      setHasChanges(false);
      toast.success("Organization updated successfully!");
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (activeOrganization) {
      setName(activeOrganization.name || "");
      setCurrentImageUrl(activeOrganization.imageUrl);
      setDescription(activeOrganization.description || "");
    }
    setImageFile(null);
    setIsEditingImage(false);
    setIsEditing(false);
    setHasChanges(false);
  };

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* VIEW MODE */}
      {!isEditing && (
        <div className="flex justify-center">
          <Card className="w-full max-w-3xl">
            <CardContent className="p-8 space-y-6">
              {/* Organization Image, Name & Description */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={currentImageUrl}
                    alt={activeOrganization.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {activeOrganization.name.charAt(0).toUpperCase()}
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
                      Edit Organization
                    </Button>
                  </div>
                  {description && (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {description}
                    </p>
                  )}
                </div>
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
            {/* Organization Image & Name */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Upload - Left Side */}
              <div>
                {!isEditingImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={currentImageUrl}
                        alt={activeOrganization.name}
                      />
                      <AvatarFallback className="text-2xl">
                        {activeOrganization.name.charAt(0).toUpperCase()}
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
                      placeholder="Upload an organization image"
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

              {/* Organization Details - Right Side */}
              <div className="flex-1 space-y-4">
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Organization Name</Label>
                  <Input
                    id="organization-name"
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
                  Describe your brand or organization in 200-500 characters
                </p>
              </div>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your brand or organization..."
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
