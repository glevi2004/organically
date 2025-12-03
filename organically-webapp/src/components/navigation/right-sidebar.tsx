"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar";

export function RightSidebarTrigger({ className }: { className?: string }) {
  return <SidebarTrigger className={className} />;
}

export function RightSidebar() {
  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarHeader>
        {/* Right sidebar header - empty for now */}
      </SidebarHeader>

      <SidebarContent>
        {/* Right sidebar content - empty for now */}
      </SidebarContent>

      <SidebarFooter>
        {/* Right sidebar footer - empty for now */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
