"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProfileDialog({
  open,
  onOpenChange,
}: CreateProfileDialogProps) {
  const router = useRouter();
  const { createProfile } = useProfile();
  const [profileName, setProfileName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileName.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setLoading(true);

    try {
      const profileId = await createProfile({
        name: profileName.trim(),
        imageFile: imageFile || undefined,
      });

      toast.success("Profile created successfully!");
      
      // Reset form
      setProfileName("");
      setImageFile(null);
      onOpenChange(false);
      
      // Navigate to new profile
      router.push(`/profile/${profileId}/home`);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogDescription>
            Create a new profile to organize your content for different brands or projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <ImageUpload
              value={imageFile || undefined}
              onChange={(file) => setImageFile(file)}
              placeholder="Upload a profile image"
            />
          </div>

          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="dialog-profile-name">
              Profile Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-profile-name"
              type="text"
              placeholder="e.g., Personal Brand, Startup, Agency"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {profileName.length}/50 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
