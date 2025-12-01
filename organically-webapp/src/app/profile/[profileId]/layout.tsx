"use client";

import { useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getProfile } from "@/services/profileService";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const profileId = params.profileId as string;

  // Get current page from URL for breadcrumb
  const currentPage = pathname.split("/").pop() || "home";
  const pageTitle = currentPage
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  useEffect(() => {
    async function validateProfile() {
      if (authLoading || profileLoading) return;

      if (!user) {
        router.push("/auth");
        return;
      }

      // Check if profile exists in user's profiles
      const profile = profiles.find((p) => p.id === profileId);

      if (!profile) {
        // Profile not found or user doesn't have access
        console.error("Profile not found or access denied");
        router.push("/onboarding");
        return;
      }

      // Set as active profile if not already
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
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/profile/${profileId}/home`}>
                    {activeProfile?.name || "Profile"}
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

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </ProtectedRoute>
  );
}
