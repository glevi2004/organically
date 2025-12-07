"use client";

import { useEffect, useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react";
import type { UseFloatingOptions } from "@floating-ui/react";
import { getSelectionBoundingRect, isSelectionValid } from "@/lib/tiptap-collab-utils";

interface FloatingElementProps {
  editor: Editor | null;
  shouldShow?: boolean;
  floatingOptions?: Partial<UseFloatingOptions>;
  zIndex?: number;
  onOpenChange?: (open: boolean) => void;
  referenceElement?: HTMLElement | null;
  getBoundingClientRect?: (editor: Editor) => DOMRect | null;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

const defaultGetBoundingClientRect = (editor: Editor): DOMRect | null => {
  return getSelectionBoundingRect(editor);
};

export function FloatingElement({
  editor,
  shouldShow,
  floatingOptions = {},
  zIndex = 50,
  onOpenChange,
  referenceElement,
  getBoundingClientRect = defaultGetBoundingClientRect,
  closeOnEscape = true,
  children,
}: FloatingElementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const virtualElementRef = useRef<{ getBoundingClientRect: () => DOMRect } | null>(null);

  const { refs, floatingStyles, update } = useFloating({
    placement: "top",
    strategy: "fixed",
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    ...floatingOptions,
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!editor) return;

    const updateVisibility = () => {
      if (shouldShow !== undefined) {
        const newVisible = shouldShow;
        setIsVisible((prev) => {
          if (prev !== newVisible) {
            onOpenChange?.(newVisible);
          }
          return newVisible;
        });
        return;
      }

      // Auto-detect visibility based on selection
      const hasValidSelection = isSelectionValid(editor);
      const rect = hasValidSelection ? getBoundingClientRect(editor) : null;

      if (hasValidSelection && rect) {
        setIsVisible((prev) => {
          if (!prev) {
            onOpenChange?.(true);
          }
          return true;
        });

        // Update virtual element
        if (!virtualElementRef.current) {
          virtualElementRef.current = {
            getBoundingClientRect: () => rect,
          };
          refs.setReference(virtualElementRef.current as any);
        } else {
          virtualElementRef.current.getBoundingClientRect = () => rect;
        }
        update();
      } else {
        setIsVisible((prev) => {
          if (prev) {
            onOpenChange?.(false);
          }
          return false;
        });
      }
    };

    // Use reference element if provided
    if (referenceElement) {
      refs.setReference(referenceElement);
      update();
    }

    // Update on selection changes
    editor.on("selectionUpdate", updateVisibility);
    editor.on("transaction", updateVisibility);

    // Initial update
    requestAnimationFrame(updateVisibility);

    return () => {
      editor.off("selectionUpdate", updateVisibility);
      editor.off("transaction", updateVisibility);
    };
  }, [editor, shouldShow, onOpenChange, referenceElement, getBoundingClientRect, refs, update]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isVisible, onOpenChange]);

  if (!isVisible || !editor) return null;

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

// Export utility function
export { isElementWithinEditor } from "@/lib/tiptap-collab-utils";

