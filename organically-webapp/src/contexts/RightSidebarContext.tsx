"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type RightSidebarMode = "ai" | "posts";

interface RightSidebarContextType {
  isOpen: boolean;
  mode: RightSidebarMode;
  postContent: ReactNode | null;
  open: (mode?: RightSidebarMode) => void;
  close: () => void;
  toggle: () => void;
  setMode: (mode: RightSidebarMode) => void;
  setPostContent: (content: ReactNode | null) => void;
  openPost: (content: ReactNode) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType | null>(null);

export function useRightSidebar() {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error(
      "useRightSidebar must be used within a RightSidebarProvider"
    );
  }
  return context;
}

export function RightSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<RightSidebarMode>("ai");
  const [postContent, setPostContent] = useState<ReactNode | null>(null);

  const open = useCallback((newMode?: RightSidebarMode) => {
    if (newMode !== undefined) {
      setMode(newMode);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset to AI mode when closing
    setMode("ai");
    setPostContent(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Closing - reset to AI mode
        setMode("ai");
        setPostContent(null);
      }
      return !prev;
    });
  }, []);

  // Convenience function to open sidebar with post content
  const openPost = useCallback((content: ReactNode) => {
    setMode("posts");
    setPostContent(content);
    setIsOpen(true);
  }, []);

  return (
    <RightSidebarContext.Provider
      value={{
        isOpen,
        mode,
        postContent,
        open,
        close,
        toggle,
        setMode,
        setPostContent,
        openPost,
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  );
}
