"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/services/imageUploadService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropDialog } from "./image-crop-dialog";

interface ImageUploadProps {
  value?: File | string;
  onChange: (file: File | null) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  placeholder = "Upload an image",
  className = "",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");

  // Generate preview URL
  const getPreviewUrl = (): string | null => {
    if (preview) return preview;
    if (typeof value === "string") return value;
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return url;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    // Open crop dialog
    const url = URL.createObjectURL(file);
    setImageToCrop(url);
    setOriginalFileName(file.name);
    setShowCropDialog(true);
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Convert blob to File
    const croppedFile = new File(
      [croppedImageBlob],
      originalFileName || "profile-image.jpg",
      { type: "image/jpeg" }
    );

    // Create preview
    const url = URL.createObjectURL(croppedFile);
    setPreview(url);
    onChange(croppedFile);

    // Cleanup
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setShowCropDialog(false);
  };

  const handleCropDialogClose = (open: boolean) => {
    if (!open) {
      // Cleanup when dialog is closed without applying
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
      }
      setImageToCrop(null);
      setShowCropDialog(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const previewUrl = getPreviewUrl();

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed
            transition-all duration-200 p-8
            ${dragOver ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-300"}
            ${error ? "border-red-500 bg-red-500/10" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewUrl} alt="Profile preview" className="object-cover" />
                <AvatarFallback>Preview</AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP or GIF (max. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {value instanceof File && (
          <div className="text-xs text-muted-foreground">
            <p>File: {value.name}</p>
            <p>Size: {(value.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={handleCropDialogClose}
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
