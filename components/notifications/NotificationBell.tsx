"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Banknote,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, type NotificationType } from "@/hooks/useNotifications";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; bg: string; color: string }
> = {
  NOUVEAU_RENDEZ_VOUS: {
    icon: <CalendarPlus className="w-4 h-4" />,
    bg: "bg-sky-500/10",
    color: "text-sky-500",
  },
  RENDEZ_VOUS_CONFIRME: {
    icon: <CalendarCheck className="w-4 h-4" />,
    bg: "bg-emerald-500/10",
    color: "text-emerald-500",
  },
  RENDEZ_VOUS_ANNULE: {
    icon: <CalendarX className="w-4 h-4" />,
    bg: "bg-rose-500/10",
    color: "text-rose-500",
  },
  RENDEZ_VOUS_MODIFIE: {
    icon: <CalendarClock className="w-4 h-4" />,
    bg: "bg-amber-500/10",
    color: "text-amber-500",
  },
  PAIEMENT_RECU: {
    icon: <Banknote className="w-4 h-4" />,
    bg: "bg-violet-500/10",
    color: "text-violet-500",
  },
  INFO: {
    icon: <Info className="w-4 h-4" />,
    bg: "bg-slate-100 dark:bg-slate-800",
    color: "text-slate-500",
  },
};

export function NotificationBell() {
  const router = useRouter();
  const { notifications, nonLues, marquerLu, marquerToutLu } = useNotifications();
  const [shaking, setShaking] = useState(false);
  const prevCountRef = useRef(nonLues);

  useEffect(() => {
    if (nonLues > prevCountRef.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      prevCountRef.current = nonLues;
      return () => clearTimeout(t);
    }
    prevCountRef.current = nonLues;
  }, [nonLues]);

  async function handleNotifClick(id: number, appointmentId: number | null) {
    await marquerLu(id);
    if (appointmentId) {
      router.push(`/record/appointments/${appointmentId}`);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg
                    hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 origin-top ${
              shaking ? "animate-shake" : ""
            }`}
          />
          {nonLues > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center
                         bg-rose-500 rounded-full border-2 border-white dark:border-slate-900
                         text-[9px] font-bold text-white leading-none px-0.5"
            >
              {nonLues > 99 ? "99+" : nonLues}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0 shadow-card-lg border border-slate-200 dark:border-[hsl(196,22%,17%)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[hsl(196,22%,17%)]">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Notifications
          </span>
          {nonLues > 0 && (
            <button
              onClick={marquerToutLu}
              className="text-xs text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                         transition-colors flex items-center gap-1"
            >
              Tout lire
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
            <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Aucune notification pour le moment
            </p>
          </div>
        ) : (
          <ul
            className="divide-y divide-slate-100 dark:divide-[hsl(196,22%,17%)]
                       max-h-[420px] overflow-y-auto"
          >
            {notifications.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.INFO;
              const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                addSuffix: true,
                locale: fr,
              });

              return (
                <li
                  key={notif.id}
                  onClick={() => handleNotifClick(notif.id, notif.appointment_id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${
                      !notif.read
                        ? "bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-[hsl(196,24%,13%)]"
                    }`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1 w-1.5">
                    {!notif.read && (
                      <span className="block w-1.5 h-1.5 rounded-full bg-sky-500" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {timeAgo}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
