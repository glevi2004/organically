"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Bot, PanelRight, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  RightSidebarProvider,
  useRightSidebar,
} from "@/contexts/RightSidebarContext";
import {
  BreadcrumbProvider,
  useBreadcrumb,
} from "@/contexts/BreadcrumbContext";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/animate-ui/components/radix/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AppSidebar,
  LeftSidebarTrigger,
  LeftSidebarProvider,
} from "@/components/navigation/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import ChatBot from "@/components/ChatBot";

const RIGHT_SIDEBAR_DEFAULT_WIDTH = 400; // pixels
const RIGHT_SIDEBAR_MIN_WIDTH = 320;
const RIGHT_SIDEBAR_MAX_WIDTH = 600;

// Floating AI button (shown when sidebar is closed)
function FloatingAIButton() {
  const { open, isOpen } = useRightSidebar();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={open}
        className="size-16 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 hover:opacity-90 shadow-md"
      >
        <Bot className="size-8 text-white" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    </div>
  );
}

// Header button (shown when sidebar is open)
function HeaderSidebarToggle() {
  const { close, isOpen } = useRightSidebar();

  if (!isOpen) return null;

  return (
    <Button variant="ghost" size="icon" onClick={close} className="size-7">
      <PanelRight className="h-4 w-4" />
      <span className="sr-only">Close Sidebar</span>
    </Button>
  );
}

function RightSidebar() {
  const { isOpen } = useRightSidebar();
  const [sidebarWidth, setSidebarWidth] = useState(RIGHT_SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Resize handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (
          newWidth >= RIGHT_SIDEBAR_MIN_WIDTH &&
          newWidth <= RIGHT_SIDEBAR_MAX_WIDTH
        ) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={sidebarRef}
      data-state={isOpen ? "expanded" : "collapsed"}
      data-side="right"
      className="group peer text-sidebar-foreground block"
      style={
        {
          "--right-sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      {/* Gap element that transitions width */}
      <div
        className={cn(
          "relative bg-transparent group-data-[state=collapsed]:w-0",
          isResizing
            ? "w-[var(--right-sidebar-width)]"
            : "w-[var(--right-sidebar-width)] transition-[width] duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)]"
        )}
      />
      {/* Sidebar container - fixed positioned */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-10 flex h-svh border-l group-data-[state=collapsed]:right-[calc(var(--right-sidebar-width)*-1)]",
          isResizing
            ? "w-[var(--right-sidebar-width)]"
            : "w-[var(--right-sidebar-width)] transition-[right,width] duration-400 ease-[cubic-bezier(0.75,0,0.25,1)]"
        )}
      >
        {/* Resize handle - only interactive when sidebar is open */}
        <div
          onMouseDown={startResizing}
          className={cn(
            "absolute inset-y-0 left-0 w-1 cursor-ew-resize hover:bg-border z-20",
            "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
            !isOpen && "pointer-events-none"
          )}
        />
        <div className="bg-sidebar flex h-full w-full flex-col overflow-hidden">
          {/* Right sidebar content - ChatBot */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatBot />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizationLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const {
    activeOrganization,
    organizations,
    loading: organizationLoading,
    setActiveOrganization,
  } = useOrganization();
  const {
    customTitle,
    isEditableTitle,
    onTitleChange,
    headerActions,
  } = useBreadcrumb();
  const organizationId = params.organizationId as string;
  
  // Local state for editing title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  // Get current page from URL for breadcrumb
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageSegments = pathSegments.slice(2);

  const formatTitle = (segment: string) =>
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const pageTitle = formatTitle(pageSegments[0] || "home");
  // Use custom title if available, otherwise format the URL segment
  const nestedPageTitle = pageSegments[1]
    ? customTitle || formatTitle(pageSegments[1])
    : null;
    
  // Handle title edit
  const handleStartEditTitle = () => {
    if (isEditableTitle && onTitleChange) {
      setEditingTitleValue(customTitle || nestedPageTitle || "");
      setIsEditingTitle(true);
    }
  };
  
  const handleSaveTitle = () => {
    if (onTitleChange && editingTitleValue.trim()) {
      onTitleChange(editingTitleValue.trim());
    }
    setIsEditingTitle(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  useEffect(() => {
    async function validateOrganization() {
      if (authLoading || organizationLoading) return;

      if (!user) {
        router.push("/auth");
        return;
      }

      const organization = organizations.find((o) => o.id === organizationId);

      if (!organization) {
        console.error("Organization not found or access denied");
        router.push("/onboarding");
        return;
      }

      if (activeOrganization?.id !== organizationId) {
        await setActiveOrganization(organizationId);
      }
    }

    validateOrganization();
  }, [
    organizationId,
    user,
    organizations,
    activeOrganization,
    authLoading,
    organizationLoading,
    router,
    setActiveOrganization,
  ]);

  if (authLoading || organizationLoading) {
    return <LoadingSpinner fullScreen text="Loading organization..." />;
  }

  return (
    <SidebarProvider>
      <LeftSidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <LeftSidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {nestedPageTitle ? (
                      <BreadcrumbLink
                        href={`/organization/${organizationId}/${pageSegments[0]}`}
                        className="text-xl font-semibold"
                      >
                        {pageTitle}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-xl font-semibold">
                        {pageTitle}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {nestedPageTitle && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isEditingTitle ? (
                          <Input
                            autoFocus
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveTitle();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="h-7 w-48 text-sm"
                          />
                        ) : isEditableTitle ? (
                          <button
                            onClick={handleStartEditTitle}
                            className="flex items-center gap-1.5 hover:bg-muted px-2 py-1 -mx-2 -my-1 rounded-md transition-colors"
                          >
                            <BreadcrumbPage>{nestedPageTitle}</BreadcrumbPage>
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        ) : (
                          <BreadcrumbPage>{nestedPageTitle}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-4 px-4">
              {/* Dynamic header actions from context */}
              {headerActions.map((action) => (
                <div key={action.id}>{action.content}</div>
              ))}
              <HeaderSidebarToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-16 pt-0 overflow-auto">
            {children}
          </div>
          {/* Fixed AI Button */}
          <FloatingAIButton />
        </SidebarInset>

        <RightSidebar />
      </LeftSidebarProvider>
    </SidebarProvider>
  );
}

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <BreadcrumbProvider>
        <RightSidebarProvider>
          <OrganizationLayoutContent>{children}</OrganizationLayoutContent>
        </RightSidebarProvider>
      </BreadcrumbProvider>
    </ProtectedRoute>
  );
}
