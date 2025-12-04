"use client";

import { useState, createContext, useContext } from "react";
import { PanelRight } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Re-export sidebar content components
export { Chatbot } from "@/components/Chatbot";

export const RIGHT_SIDEBAR_DEFAULT_WIDTH = 25; // 25% of container width
export const RIGHT_SIDEBAR_MIN_WIDTH = 20;
export const RIGHT_SIDEBAR_MAX_WIDTH = 50;

interface RightSidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export function RightSidebarTrigger({
  className,
  isOpen,
  onClick,
}: {
  className?: string;
  isOpen?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("size-7", className)}
    >
      <PanelRight className="h-4 w-4" />
      <span className="sr-only">{isOpen ? "Close" : "Open"} Sidebar</span>
    </Button>
  );
}

export function RightSidebarContent({
  children,
  className,
}: RightSidebarProps) {
  return (
    <div className={cn("h-full flex flex-col", className)}>{children}</div>
  );
}

export function RightSidebarHeader({ children, className }: RightSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center gap-2 px-4 border-b",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RightSidebarBody({ children, className }: RightSidebarProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-4", className)}>{children}</div>
  );
}

export function RightSidebarFooter({ children, className }: RightSidebarProps) {
  return (
    <div className={cn("shrink-0 border-t p-4", className)}>{children}</div>
  );
}

// Hook and context for managing right sidebar state from anywhere
interface RightSidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
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

export function RightSidebarProvider({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const value: RightSidebarContextType = {
    isOpen,
    toggle: () => setIsOpen((prev) => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  );
}

// Simplified resizable right sidebar component that uses context
export function ResizableRightSidebar({
  header,
  footer,
  children,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { isOpen } = useRightSidebar();

  if (!isOpen) return null;

  return (
    <>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={RIGHT_SIDEBAR_DEFAULT_WIDTH}
        minSize={RIGHT_SIDEBAR_MIN_WIDTH}
        maxSize={RIGHT_SIDEBAR_MAX_WIDTH}
      >
        <div className="h-full flex flex-col border-l bg-background">
          {header && <RightSidebarHeader>{header}</RightSidebarHeader>}
          <RightSidebarBody>{children}</RightSidebarBody>
          {footer && <RightSidebarFooter>{footer}</RightSidebarFooter>}
        </div>
      </ResizablePanel>
    </>
  );
}

// Standalone resizable layout wrapper (alternative approach)
interface RightSidebarLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  defaultOpen?: boolean;
}

export function RightSidebarLayout({
  children,
  sidebarContent,
  sidebarHeader,
  sidebarFooter,
  defaultOpen = false,
}: RightSidebarLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultOpen);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 w-full">
      {/* Main content panel */}
      <ResizablePanel
        defaultSize={isSidebarOpen ? 100 - RIGHT_SIDEBAR_DEFAULT_WIDTH : 100}
        minSize={30}
      >
        <div className="h-full flex flex-col">{children}</div>
      </ResizablePanel>

      {/* Resizable handle (only shown when sidebar is open) */}
      {isSidebarOpen && <ResizableHandle />}

      {/* Right sidebar panel */}
      {isSidebarOpen && (
        <ResizablePanel
          defaultSize={RIGHT_SIDEBAR_DEFAULT_WIDTH}
          minSize={RIGHT_SIDEBAR_MIN_WIDTH}
          maxSize={RIGHT_SIDEBAR_MAX_WIDTH}
        >
          <div className="h-full flex flex-col border-l bg-background">
            {sidebarHeader && (
              <RightSidebarHeader>{sidebarHeader}</RightSidebarHeader>
            )}
            <RightSidebarBody>{sidebarContent}</RightSidebarBody>
            {sidebarFooter && (
              <RightSidebarFooter>{sidebarFooter}</RightSidebarFooter>
            )}
          </div>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}

// Export a helper to get the toggle function for use in headers
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
