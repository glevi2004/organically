"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LocalMedia, MediaType } from "@/types/post";
import { ImagePlus, X, Play, GripVertical, Loader2, Cloud, CloudOff } from "lucide-react";
import { nanoid } from "nanoid";
import Image from "next/image";
import { toast } from "sonner";
import { validateMediaFile } from "@/services/postMediaService";

// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FILES = 10;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface MediaUploadProps {
  media: LocalMedia[];
  onChange: (media: LocalMedia[]) => void;
  maxFiles?: number;
  className?: string;
}

// Sortable media item
function SortableMediaItem({
  item,
  onRemove,
}: {
  item: LocalMedia;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isUploaded = item.isUploaded || (!item.file && !item.url.startsWith("blob:"));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group w-20 h-20 rounded-lg overflow-hidden bg-muted border-2 border-transparent",
        isDragging && "opacity-50 border-primary"
      )}
    >
      {item.type === "video" ? (
        <>
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt="Video thumbnail"
              fill
              className="object-cover"
              unoptimized={item.thumbnailUrl.startsWith("data:")}
            />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" muted />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </>
      ) : (
        <Image 
          src={item.url} 
          alt="Media" 
          fill 
          className="object-cover"
          unoptimized={item.url.startsWith("blob:")}
        />
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3 text-white" />
      </button>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      {/* Upload status indicator */}
      <div className="absolute bottom-1 left-1">
        {isUploaded ? (
          <div className="p-1 rounded bg-green-500/80" title="Uploaded to cloud">
            <Cloud className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <div className="p-1 rounded bg-yellow-500/80" title="Pending upload">
            <CloudOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Order indicator */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center">
        {item.order + 1}
      </div>
    </div>
  );
}

// Drag overlay item
function MediaItemOverlay({ item }: { item: LocalMedia }) {
  return (
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shadow-xl ring-2 ring-primary">
      {item.type === "video" ? (
        <>
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt="Video thumbnail"
              fill
              className="object-cover"
              unoptimized={item.thumbnailUrl.startsWith("data:")}
            />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" muted />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </>
      ) : (
        <Image 
          src={item.url} 
          alt="Media" 
          fill 
          className="object-cover"
          unoptimized={item.url.startsWith("blob:")}
        />
      )}
    </div>
  );
}

export function MediaUpload({
  media,
  onChange,
  maxFiles = MAX_FILES,
  className,
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = media.find((m) => m.id === activeId);

  const getMediaType = (file: File): MediaType | null => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
    return null;
  };

  const createVideoThumbnail = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration); // Seek to 1 second or end
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve(undefined);
        }
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve(undefined);
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(undefined);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxFiles - media.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setIsProcessing(true);

      try {
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const newMedia: LocalMedia[] = [];
        const errors: string[] = [];

        for (const file of filesToProcess) {
          // Validate file using the service
          const validation = validateMediaFile(file);
          if (!validation.valid) {
            errors.push(`${file.name}: ${validation.error}`);
            continue;
          }

          const mediaType = getMediaType(file);
          if (!mediaType) {
            errors.push(`${file.name}: Unsupported file type`);
            continue;
          }

          const url = URL.createObjectURL(file);
          let thumbnailUrl: string | undefined;
          let duration: number | undefined;

          if (mediaType === "video") {
            [thumbnailUrl, duration] = await Promise.all([
              createVideoThumbnail(file),
              getVideoDuration(file),
            ]);
          }

          newMedia.push({
            id: nanoid(),
            url,
            type: mediaType,
            thumbnailUrl,
            duration,
            order: media.length + newMedia.length,
            file, // Store the file reference for upload
            isUploaded: false, // Mark as not uploaded yet
          });
        }

        // Show errors if any
        if (errors.length > 0) {
          errors.forEach((err) => toast.error(err));
        }

        if (newMedia.length > 0) {
          onChange([...media, ...newMedia]);
        }
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [media, maxFiles, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const item = media.find((m) => m.id === id);
      if (item) {
        // Revoke blob URLs
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
        if (item.thumbnailUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(item.thumbnailUrl);
        }
      }

      const newMedia = media
        .filter((m) => m.id !== id)
        .map((m, index) => ({ ...m, order: index }));

      onChange(newMedia);
    },
    [media, onChange]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newMedia = [...media];
    const [movedItem] = newMedia.splice(oldIndex, 1);
    newMedia.splice(newIndex, 0, movedItem);

    // Update orders
    onChange(newMedia.map((m, index) => ({ ...m, order: index })));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Count pending uploads
  const pendingCount = media.filter((m) => !m.isUploaded && m.file).length;

  return (
    <div className={cn("space-y-3", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <SortableContext
            items={media.map((m) => m.id)}
            strategy={horizontalListSortingStrategy}
          >
            {media.map((item) => (
              <SortableMediaItem
                key={item.id}
                item={item}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </SortableContext>

          {/* Add button */}
          {media.length < maxFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={cn(
                "w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1",
                "hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors",
                "text-muted-foreground"
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px]">Add</span>
                </>
              )}
            </button>
          )}
        </div>

        <DragOverlay>
          {activeItem ? <MediaItemOverlay item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <input
        ref={fileInputRef}
        type="file"
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")}
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Info text */}
      <p className="text-[10px] text-muted-foreground">
        {media.length}/{maxFiles} • Drag to reorder • Images up to 10MB, videos up to 250MB
        {pendingCount > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            {" "}• {pendingCount} pending upload
          </span>
        )}
      </p>
    </div>
  );
}
