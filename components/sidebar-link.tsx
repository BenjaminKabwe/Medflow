"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  href: string;
  name: string;
  icon: LucideIcon;
  collapsed?: boolean;
  /** Only highlight when the path matches exactly (no children) */
  exact?: boolean;
}

export const SidebarLink = ({ href, name, icon: Icon, collapsed, exact = false }: SidebarLinkProps) => {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={collapsed ? name : undefined}
      className={cn(
        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/20 dark:bg-sky-400/[0.14] dark:text-white dark:ring-sky-400/20"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white"
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sky-400 shadow-[0_0_8px_hsl(199_89%_48%_/_0.6)]" />
      )}
      <Icon
        className={cn(
          "flex-shrink-0 transition-colors duration-150 size-[18px]",
          isActive ? "text-sky-600 dark:text-sky-300" : "text-slate-400 group-hover:text-slate-700 dark:text-white/45 dark:group-hover:text-white/90"
        )}
      />
      {!collapsed && <span className="truncate">{name}</span>}
      {!collapsed && isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 shadow-[0_0_6px_hsl(199_89%_48%_/_0.8)]" />
      )}
    </Link>
  );
};
