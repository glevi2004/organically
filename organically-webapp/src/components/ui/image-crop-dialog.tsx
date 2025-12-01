"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
}

/**
 * Create a cropped image blob from the source image
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg", 0.95);
  });
}

/**
 * Helper to create an image element from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      console.log("Image loaded successfully:", image.width, "x", image.height);
      resolve(image);
    });
    image.addEventListener("error", (error) => {
      console.error("Image load error:", error);
      reject(new Error("Failed to load image"));
    });
    // Set crossOrigin for blob URLs (shouldn't be needed but doesn't hurt)
    if (url.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.src = url;
  });
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const onCropAreaComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      console.log("Crop area updated:", croppedAreaPixels);
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const onMediaLoadedCallback = useCallback(() => {
    console.log("Media loaded successfully");
    setMediaLoaded(true);
  }, []);

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) {
      console.warn("No cropped area defined");
      return;
    }

    setLoading(true);
    try {
      console.log("Starting crop with area:", croppedAreaPixels);
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      console.log("Crop successful, blob size:", croppedImage.size);
      onCropComplete(croppedImage);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert(`Failed to crop image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adjust Your Profile Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper Area */}
          <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaComplete}
              onMediaLoaded={onMediaLoadedCallback}
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Zoom</span>
              <span className="text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Drag to reposition • Use slider to zoom
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCropConfirm}
            disabled={loading || !mediaLoaded || !croppedAreaPixels}
            className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 text-white"
          >
            {loading ? "Processing..." : !mediaLoaded ? "Loading..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

