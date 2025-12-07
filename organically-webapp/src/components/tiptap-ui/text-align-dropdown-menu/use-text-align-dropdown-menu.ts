"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Lib ---
import { isExtensionAvailable } from "@/lib/tiptap-utils"

// --- Tiptap UI ---
import {
  type TextAlign,
  canSetTextAlign,
  isTextAlignActive,
  textAlignIcons,
  textAlignLabels,
} from "@/components/tiptap-ui/text-align-button"

export interface UseTextAlignDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Available alignment options
   * @default ["left", "center", "right", "justify"]
   */
  aligns?: TextAlign[]
  /**
   * Whether the button should hide when alignment is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Custom hook that provides text align dropdown menu functionality
 */
export function useTextAlignDropdownMenu(
  config: UseTextAlignDropdownMenuConfig
) {
  const {
    editor: providedEditor,
    aligns = ["left", "center", "right", "justify"],
    hideWhenUnavailable = false,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  const canToggle = editor
    ? aligns.some((align) => canSetTextAlign(editor, align))
    : false

  // Get the currently active alignment
  const activeAlign = aligns.find(
    (align) => editor && isTextAlignActive(editor, align)
  )

  const Icon = activeAlign ? textAlignIcons[activeAlign] : textAlignIcons.left
  const isActive = !!activeAlign

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      if (hideWhenUnavailable) {
        const hasAvailableAlign = aligns.some((align) =>
          canSetTextAlign(editor, align)
        )
        setIsVisible(hasAvailableAlign)
      } else {
        setIsVisible(isExtensionAvailable(editor, "textAlign"))
      }
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable, aligns])

  return {
    isVisible,
    isActive,
    canToggle,
    Icon,
    activeAlign,
    aligns,
  }
}

