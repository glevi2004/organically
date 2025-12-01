"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getWorkspace } from "@/services/workspaceService";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
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
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function WorkspaceLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const {
    activeWorkspace,
    workspaces,
    loading: workspaceLoading,
    setActiveWorkspace,
  } = useWorkspace();
  const workspaceId = params.workspaceId as string;

  // Get current page from URL for breadcrumb
  const currentPage = pathname.split("/").pop() || "dashboard";
  const pageTitle = currentPage
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  useEffect(() => {
    async function validateWorkspace() {
      if (authLoading || workspaceLoading) return;

      if (!user) {
        router.push("/auth");
        return;
      }

      // Check if workspace exists in user's workspaces
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (!workspace) {
        // Workspace not found or user doesn't have access
        console.error("Workspace not found or access denied");
        router.push("/onboarding");
        return;
      }

      // Set as active workspace if not already
      if (activeWorkspace?.id !== workspaceId) {
        await setActiveWorkspace(workspaceId);
      }
    }

    validateWorkspace();
  }, [
    workspaceId,
    user,
    workspaces,
    activeWorkspace,
    authLoading,
    workspaceLoading,
    router,
    setActiveWorkspace,
  ]);

  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/workspace/${workspaceId}/dashboard`}>
                    {activeWorkspace?.name || "Workspace"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </ProtectedRoute>
  );
}
