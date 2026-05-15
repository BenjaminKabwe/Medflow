import { getRole } from "@/utils/roles";
import { Navbar } from "@/components/navbar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import { ProtectedLayoutClient } from "@/components/protected-layout-client";
import React from "react";

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const role = await getRole();

  return (
    <SidebarProvider>
      <div className="w-full h-screen flex overflow-hidden bg-slate-50 dark:bg-[hsl(222,47%,6%)]">

        {/* Desktop sidebar — width controlled by collapsed state */}
        <DesktopSidebar role={role} />

        {/* Mobile sidebar overlay */}
        <ProtectedLayoutClient role={role}>
          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <Navbar notificationBell={<NotificationBell />} />
            <div className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
              {children}
            </div>
          </div>
        </ProtectedLayoutClient>

      </div>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
