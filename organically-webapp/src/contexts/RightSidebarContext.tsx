"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";

interface RightSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOnOpen: (callback: (() => void) | null) => void;
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
  const onOpenCallbackRef = useRef<(() => void) | null>(null);

  const setOnOpen = useCallback((callback: (() => void) | null) => {
    onOpenCallbackRef.current = callback;
  }, []);

  const open = useCallback(() => {
    onOpenCallbackRef.current?.();
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <RightSidebarContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        setOnOpen,
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  );
}
