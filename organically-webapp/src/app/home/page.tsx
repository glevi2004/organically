"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  Home,
  LayoutDashboard,
  Settings,
  User,
  FileText,
  CalendarDays,
} from "lucide-react";

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
      console.error("Error signing out:", error);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-4">
                <span className="text-2xl">🌱</span>
                <span className="font-bold text-lg">Organically</span>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <a href="/home">
                      <Home />
                      <span>Home</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/home">
                      <LayoutDashboard />
                      <span>Content Plans</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/home">
                      <CalendarDays />
                      <span>Calendar</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/home">
                      <FileText />
                      <span>Outlines</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/home">
                      <LayoutDashboard />
                      <span>Templates</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/home">
                  <User />
                  <span>{user?.email || "Account"}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/home">
                  <Settings />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>

          <div className="flex-1 bg-background relative overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute left-1/3 top-1/4 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
              <div className="absolute right-1/3 bottom-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-3xl rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                {/* Welcome Card */}
                <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center space-y-6">
                  <div className="space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-bold">
                      Welcome to{" "}
                      <span className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        Organically
                      </span>
                    </h1>

                    {user?.email && (
                      <p className="text-lg text-muted-foreground">
                        Signed in as{" "}
                        <span className="font-medium text-foreground">
                          {user.email}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <p className="text-muted-foreground mb-6">
                      Your personalized content growth dashboard is coming soon.
                    </p>
                  </div>
                </div>

                {/* Quick Stats Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Content Plans
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Platforms
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Posts Generated
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
