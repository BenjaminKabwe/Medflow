"use client";

import { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { useSidebarContext } from "./sidebar-context";

interface Props {
  role: string;
  children: ReactNode;
}

export const ProtectedLayoutClient = ({ role, children }: Props) => {
  const { mobileOpen, closeMobile } = useSidebarContext();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] h-full shadow-2xl flex-shrink-0">
            <SidebarNav role={role} />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
        </div>
      )}

      {children}
    </>
  );
};
