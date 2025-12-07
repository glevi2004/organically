"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
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

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const router = useRouter();
  const { createOrganization } = useOrganization();
  const [organizationName, setOrganizationName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setLoading(true);

    try {
      const organizationId = await createOrganization({
        name: organizationName.trim(),
        imageFile: imageFile || undefined,
      });

      toast.success("Organization created successfully!");
      
      // Reset form
      setOrganizationName("");
      setImageFile(null);
      onOpenChange(false);
      
      // Navigate to new organization
      router.push(`/organization/${organizationId}/home`);
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to organize your content for different brands or projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Organization Image</Label>
            <ImageUpload
              value={imageFile || undefined}
              onChange={(file) => setImageFile(file)}
              placeholder="Upload an organization image"
            />
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="dialog-organization-name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dialog-organization-name"
              type="text"
              placeholder="e.g., Personal Brand, Startup, Agency"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {organizationName.length}/50 characters
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
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
