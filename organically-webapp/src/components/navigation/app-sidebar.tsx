"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Settings,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  BarChart3,
  Lightbulb,
  Calendar,
  FileEdit,
  Globe,
  PanelLeftIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";

// Create a context to share the left sidebar's toggle function
const LeftSidebarContext = React.createContext<{
  toggleLeftSidebar: () => void;
  isLeftSidebarOpen: boolean;
} | null>(null);

export function useLeftSidebar() {
  const context = React.useContext(LeftSidebarContext);
  if (!context) {
    throw new Error("useLeftSidebar must be used within LeftSidebarProvider");
  }
  return context;
}

export function LeftSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <LeftSidebarContext.Provider
      value={{ toggleLeftSidebar: toggleSidebar, isLeftSidebarOpen: open }}
    >
      {children}
    </LeftSidebarContext.Provider>
  );
}

export function LeftSidebarTrigger({
  className,
  onBeforeOpen,
}: {
  className?: string;
  onBeforeOpen?: () => void;
}) {
  const { toggleLeftSidebar, isLeftSidebarOpen } = useLeftSidebar();

  const handleToggle = () => {
    if (!isLeftSidebarOpen && onBeforeOpen) {
      onBeforeOpen();
    }
    toggleLeftSidebar();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleToggle}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Left Sidebar</span>
    </Button>
  );
}

const getNavMain = (profileId: string) => [
  {
    title: "Home",
    url: `/profile/${profileId}/home`,
    icon: Home,
  },
  {
    title: "Idea Dump",
    url: `/profile/${profileId}/idea-dump`,
    icon: Lightbulb,
  },
  {
    title: "Calendar",
    url: `/profile/${profileId}/calendar`,
    icon: Calendar,
  },
  {
    title: "Posts",
    url: `/profile/${profileId}/posts`,
    icon: FileEdit,
  },
  {
    title: "Profile",
    url: `/profile/${profileId}/profile`,
    icon: Globe,
  },
  {
    title: "Settings",
    url: `/profile/${profileId}/settings`,
    icon: Settings,
  },
];

function AppSidebarContent() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { open: isSidebarOpen } = useSidebar();

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

  const getUserInitials = () => {
    if (user?.email) {
      return user.email
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const navMain = activeProfile ? getNavMain(activeProfile.id) : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Profile Switcher */}
        <SidebarMenu>
          <SidebarMenuItem>
            <ProfileSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Nav Main */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
              const isActive = pathname === item.url;
              const isParentActive =
                item.items?.some((sub) => pathname === sub.url) || false;

              // If item has sub-items, render as collapsible (Settings)
              if (item.items && item.items.length > 0) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isParentActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <Tooltip open={isSidebarOpen ? false : undefined}>
                        <TooltipTrigger asChild>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={isParentActive}>
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }
              // Otherwise, render as simple button (Home, Analytics, etc.)
              return (
                <SidebarMenuItem key={item.title}>
                  <Tooltip open={isSidebarOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Nav User */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.photoURL || ""}
                      alt={user?.email || "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName ||
                        user?.email?.split("@")[0] ||
                        "User"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.photoURL || ""}
                        alt={user?.email || "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.displayName ||
                          user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-4 px-2 py-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Theme
                  </span>
                  <ModeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar() {
  return <AppSidebarContent />;
}
