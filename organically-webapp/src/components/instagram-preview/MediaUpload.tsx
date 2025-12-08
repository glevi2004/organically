"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PostMedia, MediaType } from "@/types/post";
import { ImagePlus, X, Play, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";
import Image from "next/image";

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_FILES = 10;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface MediaUploadProps {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
  maxFiles?: number;
  className?: string;
}

// Sortable media item
function SortableMediaItem({
  item,
  onRemove,
}: {
  item: PostMedia;
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
            />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" muted />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </>
      ) : (
        <Image src={item.url} alt="Media" fill className="object-cover" />
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

      {/* Order indicator */}
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center">
        {item.order + 1}
      </div>
    </div>
  );
}

// Drag overlay item
function MediaItemOverlay({ item }: { item: PostMedia }) {
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
            />
          ) : (
            <video src={item.url} className="w-full h-full object-cover" muted />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </>
      ) : (
        <Image src={item.url} alt="Media" fill className="object-cover" />
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
  const [isUploading, setIsUploading] = useState(false);
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
        video.currentTime = 1; // Seek to 1 second
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

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxFiles - media.length;
      if (remainingSlots <= 0) return;

      setIsUploading(true);

      try {
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        const newMedia: PostMedia[] = [];

        for (const file of filesToProcess) {
          // Validate file
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`File ${file.name} exceeds maximum size`);
            continue;
          }

          const mediaType = getMediaType(file);
          if (!mediaType) {
            console.warn(`File ${file.name} has unsupported type`);
            continue;
          }

          const url = URL.createObjectURL(file);
          let thumbnailUrl: string | undefined;

          if (mediaType === "video") {
            thumbnailUrl = await createVideoThumbnail(file);
          }

          newMedia.push({
            id: nanoid(),
            url,
            type: mediaType,
            thumbnailUrl,
            order: media.length + newMedia.length,
          });
        }

        if (newMedia.length > 0) {
          onChange([...media, ...newMedia]);
        }
      } finally {
        setIsUploading(false);
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
        URL.revokeObjectURL(item.url);
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
              disabled={isUploading}
              className={cn(
                "w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1",
                "hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors",
                "text-muted-foreground"
              )}
            >
              {isUploading ? (
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
        {media.length}/{maxFiles} • Drag to reorder • Images & videos up to 50MB
      </p>
    </div>
  );
}

