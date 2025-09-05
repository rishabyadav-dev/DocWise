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
import { usePathname } from "next/navigation";
import { ModeToggle } from "../theme/mode-toggle";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";

export function AppSidebar() {
  const { data: session } = useSession();
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Docwise-Chat with PDF</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              <SidebarMenuItem className="  rounded-lg">
                <SidebarMenuButton
                  className="bg-accent/50 border shadow-xs hover:bg-input/50"
                  asChild
                  isActive={pathname === "/"}
                >
                  <a href={"/"}>
                    <PenBoxIcon />
                    <span>{"New chat"}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* <SidebarMenuItem className=" rounded-lg">
                <SidebarMenuButton
                  className="bg-accent/50 border shadow-xs hover:bg-input/50"
                  asChild
                  isActive={pathname === "/settings"}
                >
                  <a href={"/settings"}>
                    <Settings />
                    <span>{"Settings"}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
              <SidebarMenuItem className="  rounded-lg">
                <SidebarMenuButton className="cursor-pointer " asChild>
                  <ModeToggle className="w-full !shadow-xs" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="list-none">
          {open && (
            <SidebarMenuItem className="flex  list-none">
              <div>Hi, </div>
              {session?.user.name && <div>{session?.user.name}</div>}
            </SidebarMenuItem>
          )}
          <SidebarMenuItem className="list-none">
            <SidebarMenuButton
              title="signout"
              onClick={signOutAction}
              className="hover:bg-red-100  bg-red-400 border shadow-xs hover:text-red-600 transition-colors cursor-pointer w-full"
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
