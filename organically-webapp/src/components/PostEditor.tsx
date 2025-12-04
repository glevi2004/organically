"use client"

import { useEffect, useRef } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { Markdown } from "tiptap-markdown"
import { Loader2, Check } from "lucide-react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { Typography } from "@tiptap/extension-typography"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { LinkPopover } from "@/components/tiptap-ui/link-popover"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "./post-editor.scss"

export type SaveStatus = "idle" | "saving" | "saved"

interface PostEditorProps {
  content: string
  onChange: (content: string) => void
  saveStatus?: SaveStatus
  placeholder?: string
}

export function PostEditor({ content, onChange, saveStatus = "idle", placeholder }: PostEditorProps) {
  const initialContentRef = useRef(content)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "post-editor-textarea",
        "data-placeholder": placeholder || "What's happening?",
      },
    },
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Markdown.configure({
        html: true,
        transformCopiedText: true,
        transformPastedText: true,
      }),
      Image,
      Typography,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContentRef.current,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown()
      onChange(markdown)
    },
  })

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== initialContentRef.current) {
      const currentMarkdown = editor.storage.markdown?.getMarkdown() || ""
      if (content !== currentMarkdown) {
        editor.commands.setContent(content)
        initialContentRef.current = content
      }
    }
  }, [content, editor])

  return (
    <div className="post-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {/* Content Area */}
        <div className="post-editor-content">
          <EditorContent editor={editor} />
        </div>

        {/* Toolbar */}
        <div className="post-editor-toolbar">
          <div className="post-editor-toolbar-left">
            <ImageUploadButton />
            
            <div className="post-editor-separator" />
            
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            <MarkButton type="strike" />
            
            <div className="post-editor-separator" />
            
            <ListDropdownMenu types={["bulletList", "orderedList"]} />
            <LinkPopover />
          </div>

          <div className="post-editor-toolbar-right">
            {saveStatus === "saving" && (
              <span className="post-editor-status post-editor-status-saving">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="post-editor-status post-editor-status-saved">
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>
      </EditorContext.Provider>
    </div>
  )
}
