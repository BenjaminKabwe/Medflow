"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { ChevronRight, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { ThemeToggle } from "./theme-toggle";
import { useLanguage } from "./providers";
import { LanguageSwitcher } from "./language-switcher";
import { useSidebarContext } from "./sidebar-context";

interface NavbarProps {
  notificationBell?: React.ReactNode;
}

export const Navbar = ({ notificationBell }: NavbarProps) => {
  const { userId } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toggleMobile } = useSidebarContext();

  const segments = pathname?.split("/").filter(Boolean) ?? [];

  const breadcrumbs = segments.map((seg, i) => ({
    label:
      (t.pages as Record<string, string>)[seg] ??
      seg.replace(/-/g, " "),
    isLast: i === segments.length - 1,
  }));

  const pageTitle =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : "MedFlow";

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center justify-between px-4 md:px-6 gap-4
                bg-white dark:bg-[hsl(222,47%,8%)]
                border-b border-slate-200 dark:border-[hsl(222,47%,14%)]"
    >
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
                    hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 flex-shrink-0"
          onClick={toggleMobile}
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        {breadcrumbs.length > 1 ? (
          breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              <span
                className={
                  crumb.isLast
                    ? "text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize truncate"
                    : "text-sm text-slate-400 capitalize truncate"
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))
        ) : (
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right: search + lang + theme + notifications + user */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <button
          className="hidden md:flex items-center gap-2
                    text-slate-400 dark:text-slate-500
                    bg-slate-100 dark:bg-slate-800
                    hover:bg-slate-200 dark:hover:bg-slate-700
                    px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{t.navbar.search}</span>
          <kbd
            className="ml-2 px-1.5 py-0.5 rounded
                      bg-white dark:bg-slate-900
                      border border-slate-200 dark:border-slate-700
                      text-[10px] font-mono text-slate-400"
          >
            ⌘K
          </kbd>
        </button>

        {/* Language toggle */}
        <div className="hidden md:flex" title={t.navbar.lang}>
          <LanguageSwitcher />
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        {notificationBell}

        {/* User avatar */}
        {userId && <UserButton />}
      </div>
    </header>
  );
};
