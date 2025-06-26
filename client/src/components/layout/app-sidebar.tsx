import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PenBoxIcon, Settings } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat with PDF</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="">
              <SidebarMenuItem className="bg-blue-100  rounded-lg">
                <SidebarMenuButton className="hover:bg-blue-300" asChild>
                  <a href={"/"}>
                    <PenBoxIcon />
                    <span>{"New chat"}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="bg-blue-100  rounded-lg">
                <SidebarMenuButton className="hover:bg-blue-300" asChild>
                  <a href={"/settings"}>
                    <Settings />
                    <span>{"Settings"}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
