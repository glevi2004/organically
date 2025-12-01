"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId === activeWorkspace?.id) return;
    
    await setActiveWorkspace(workspaceId);
    router.push(`/workspace/${workspaceId}/dashboard`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg border text-sidebar-primary-foreground">
              <span className="text-xl">{activeWorkspace?.icon || "🌱"}</span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeWorkspace?.name || "Select Workspace"}
              </span>
              <span className="truncate text-xs">
                {activeWorkspace?.description || "No description"}
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
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((workspace, index) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSwitch(workspace.id)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <span className="text-sm">{workspace.icon}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{workspace.name}</div>
                {workspace.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {workspace.description}
                  </div>
                )}
              </div>
              {activeWorkspace?.id === workspace.id && (
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
              Create Workspace
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}

