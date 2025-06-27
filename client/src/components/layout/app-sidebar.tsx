"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/serverActions/signout";
import { ArrowLeftFromLine, PenBoxIcon, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

export function AppSidebar() {
  const { data: session } = useSession();
  const { open } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat with PDF</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
      <SidebarFooter>
        <SidebarMenu className="list-none">
          {open && (
            <SidebarMenuItem className="ml-2">
              <span>Hi, </span>
              <span>{session?.user.name}</span>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem className="list-none">
            <SidebarMenuButton
              title="signout"
              onClick={signOutAction}
              className="hover:bg-red-100 bg-red-200 hover:text-red-600 transition-colors cursor-pointer w-full"
            >
              <ArrowLeftFromLine className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
