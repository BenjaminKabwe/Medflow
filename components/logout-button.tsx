"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useLanguage } from "./providers";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
}

export const LogoutButton = ({ collapsed }: Props) => {
  const { signOut } = useClerk();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      title={collapsed ? t.nav.logout : undefined}
      className={cn(
        "flex items-center rounded-xl text-sm font-medium",
        "text-slate-600 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
        "transition-all duration-150 group",
        collapsed
          ? "justify-center w-10 h-10 px-0"
          : "w-full gap-3 px-3 py-2.5"
      )}
    >
      <LogOut className="w-[18px] h-[18px] flex-shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
      {!collapsed && <span>{t.nav.logout}</span>}
    </button>
  );
};
