"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { useSession } from "next-auth/react";

export function SidebarWrapper() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  return session ? <AppSidebar /> : null;
}
