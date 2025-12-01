"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/animate-ui/components/radix/sidebar";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { CreateProfileDialog } from "./CreateProfileDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultProfileImageUrl } from "@/services/imageUploadService";

export function ProfileSwitcher() {
  const router = useRouter();
  const { activeProfile, profiles, setActiveProfile } = useProfile();
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const handleProfileSwitch = async (profileId: string) => {
    if (profileId === activeProfile?.id) return;
    
    await setActiveProfile(profileId);
    router.push(`/profile/${profileId}/home`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={activeProfile?.imageUrl || getDefaultProfileImageUrl()}
                alt={activeProfile?.name || "Profile"}
              />
              <AvatarFallback className="rounded-lg">
                {activeProfile?.name?.charAt(0).toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeProfile?.name || "Select Profile"}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Profiles
          </DropdownMenuLabel>
          {profiles.map((profile, index) => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => handleProfileSwitch(profile.id)}
              className="gap-2 p-2"
            >
              <Avatar className="h-6 w-6 rounded-sm">
                <AvatarImage
                  src={profile.imageUrl || getDefaultProfileImageUrl()}
                  alt={profile.name}
                />
                <AvatarFallback className="rounded-sm text-xs">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{profile.name}</div>
              </div>
              {activeProfile?.id === profile.id && (
                <Check className="ml-auto size-4 text-emerald-500" />
              )}
              {index < 9 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  ⌘{index + 1}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border border-dashed">
              <Plus className="size-4" />
            </div>
            <div className="font-medium text-muted-foreground">
              Create Profile
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProfileDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
