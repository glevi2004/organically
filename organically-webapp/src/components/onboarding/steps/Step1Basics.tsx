"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";

interface Step1Data {
  name: string;
  imageFile?: File | null;
  currentImageUrl?: string;
}

interface Step1BasicsProps {
  data: Step1Data;
  onDataChange: (data: Step1Data) => void;
}

export function Step1Basics({ data, onDataChange }: Step1BasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
        <p className="text-muted-foreground">
          Let's start with the basics. Your profile is where you'll manage your
          content plans, ideas, and posts.
        </p>
      </div>

      {/* Profile Image */}
      <div className="space-y-2">
        <Label>Profile Image (Optional)</Label>
        <ImageUpload
          value={data.imageFile || data.currentImageUrl}
          onChange={(file) => onDataChange({ ...data, imageFile: file })}
          placeholder="Upload a profile image"
        />
      </div>

      {/* Profile Name */}
      <div className="space-y-2">
        <Label htmlFor="profile-name">
          Profile Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="profile-name"
          type="text"
          placeholder="e.g., Personal Brand, Startup, Agency"
          value={data.name}
          onChange={(e) => onDataChange({ ...data, name: e.target.value })}
          required
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {data.name.length}/50 characters
        </p>
      </div>
    </div>
  );
}
