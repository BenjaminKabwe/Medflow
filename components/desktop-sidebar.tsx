"use client";

import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { useSidebarContext } from "./sidebar-context";

interface Props {
  role: string;
}

export const DesktopSidebar = ({ role }: Props) => {
  const { collapsed } = useSidebarContext();

  return (
    <div
      className={cn(
        "hidden lg:flex flex-shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[64px]" : "w-[240px] xl:w-[260px]"
      )}
    >
      <SidebarNav role={role} />
    </div>
  );
};
