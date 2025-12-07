"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
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
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultOrganizationImageUrl } from "@/services/imageUploadService";

export function OrganizationSwitcher() {
  const router = useRouter();
  const { activeOrganization, organizations, setActiveOrganization } = useOrganization();
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const handleOrganizationSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) return;
    
    await setActiveOrganization(organizationId);
    router.push(`/organization/${organizationId}/home`);
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
                src={activeOrganization?.imageUrl || getDefaultOrganizationImageUrl()}
                alt={activeOrganization?.name || "Organization"}
              />
              <AvatarFallback className="rounded-lg">
                {activeOrganization?.name?.charAt(0).toUpperCase() || "O"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeOrganization?.name || "Select Organization"}
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
            Organizations
          </DropdownMenuLabel>
          {organizations.map((organization, index) => (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => handleOrganizationSwitch(organization.id)}
              className="gap-2 p-2"
            >
              <Avatar className="h-6 w-6 rounded-sm">
                <AvatarImage
                  src={organization.imageUrl || getDefaultOrganizationImageUrl()}
                  alt={organization.name}
                />
                <AvatarFallback className="rounded-sm text-xs">
                  {organization.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{organization.name}</div>
              </div>
              {activeOrganization?.id === organization.id && (
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
              Create Organization
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
