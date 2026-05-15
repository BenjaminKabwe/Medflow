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
        "group flex items-center rounded-xl text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0 transition-colors duration-150 size-[18px]",
          isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
        )}
      />
      {!collapsed && <span className="truncate">{name}</span>}
      {!collapsed && isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 flex-shrink-0" />
      )}
    </Link>
  );
};
