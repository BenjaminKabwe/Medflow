import { getUnreadCount } from "@/utils/services/notification";
import { Bell } from "lucide-react";
import Link from "next/link";

export const NotificationBell = async () => {
  const unreadCount = await getUnreadCount();

  return (
    <Link
      href="/notifications"
      className="relative w-8 h-8 flex items-center justify-center rounded-lg
                 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center
                         bg-rose-500 rounded-full border-2 border-white dark:border-slate-900
                         text-[9px] font-bold text-white leading-none px-0.5">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};
