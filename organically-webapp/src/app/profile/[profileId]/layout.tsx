"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Bot, PanelRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import {
  RightSidebarProvider,
  useRightSidebar,
} from "@/contexts/RightSidebarContext";
import {
  BreadcrumbProvider,
  useBreadcrumb,
} from "@/contexts/BreadcrumbContext";
import { Chatbot } from "@/components/navigation/right-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

const RIGHT_SIDEBAR_DEFAULT_WIDTH = 400; // pixels
const RIGHT_SIDEBAR_MIN_WIDTH = 320;
const RIGHT_SIDEBAR_MAX_WIDTH = 600;

// Floating AI button (shown when sidebar is closed)
function FloatingAIButton() {
  const { open, isOpen } = useRightSidebar();
  const { setOpen: setLeftOpen } = useSidebar();

  if (isOpen) return null;

  const handleClick = () => {
    setLeftOpen(false);
    open();
  };

  return (
    <Button
      onClick={handleClick}
      className="size-16 rounded-full bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 hover:opacity-90 shadow-md"
    >
      <Bot className="size-8 text-white" />
      <span className="sr-only">Open AI Assistant</span>
    </Button>
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

// Component to register the left sidebar close callback with right sidebar context
// This is used for openPost() calls from other components
function SidebarCallbackRegistrar() {
  const { setOnOpen } = useRightSidebar();
  const { setOpen: setLeftOpen } = useSidebar();

  useEffect(() => {
    setOnOpen(() => setLeftOpen(false));
    return () => setOnOpen(null);
  }, [setOnOpen, setLeftOpen]);

  return null;
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
        <div className="bg-sidebar flex h-full w-full flex-col">
          {/* Right sidebar content - AI Chatbot */}
          <div className="flex-1 overflow-auto">
            <Chatbot />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const {
    activeProfile,
    profiles,
    loading: profileLoading,
    setActiveProfile,
  } = useProfile();
  const { close: closeRightSidebar } = useRightSidebar();
  const { customTitle } = useBreadcrumb();
  const profileId = params.profileId as string;

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

  useEffect(() => {
    async function validateProfile() {
      if (authLoading || profileLoading) return;

      if (!user) {
        router.push("/auth");
        return;
      }

      const profile = profiles.find((p) => p.id === profileId);

      if (!profile) {
        console.error("Profile not found or access denied");
        router.push("/onboarding");
        return;
      }

      if (activeProfile?.id !== profileId) {
        await setActiveProfile(profileId);
      }
    }

    validateProfile();
  }, [
    profileId,
    user,
    profiles,
    activeProfile,
    authLoading,
    profileLoading,
    router,
    setActiveProfile,
  ]);

  if (authLoading || profileLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  return (
    <SidebarProvider>
      <SidebarCallbackRegistrar />
      <LeftSidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <LeftSidebarTrigger
                className="-ml-1"
                onBeforeOpen={closeRightSidebar}
              />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {nestedPageTitle ? (
                      <BreadcrumbLink
                        href={`/profile/${profileId}/${pageSegments[0]}`}
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
                        <BreadcrumbPage>{nestedPageTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              <HeaderSidebarToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-16 pt-0 overflow-auto">
            {children}
          </div>
          <div className="absolute bottom-6 right-6">
            <FloatingAIButton />
          </div>
        </SidebarInset>

        <RightSidebar />
      </LeftSidebarProvider>
    </SidebarProvider>
  );
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <BreadcrumbProvider>
        <RightSidebarProvider>
          <ProfileLayoutContent>{children}</ProfileLayoutContent>
        </RightSidebarProvider>
      </BreadcrumbProvider>
    </ProtectedRoute>
  );
}
