import { getNotifications, getAllNotificationsAdmin } from "@/utils/services/notification";
import { markAsRead, markAllAsRead } from "@/app/actions/notification";
import { checkRole } from "@/utils/roles";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Banknote,
  Info,
  CheckCheck,
  ArrowRight,
  User,
  PackageMinus,
  AlertTriangle,
  Pill,
} from "lucide-react";
import { NotificationType } from "@/lib/generated/prisma/enums";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    center: "Centre de notifications",
    allNotifs: "Toutes les notifications",
    noNotif: "Aucune notification",
    noNotifAdminDesc: "Aucune notification n'a encore été générée dans le système.",
    read: "Lu",
    unread: "Non lu",
    notifs: "Notifications",
    unreadCount: (n: number) => `${n} non lue${n > 1 ? "s" : ""}`,
    markAll: "Tout marquer comme lu",
    noNotifUserDesc:
      "Vous n'avez aucune notification pour le moment. Les alertes et mises à jour apparaîtront ici.",
    markRead: "Marquer comme lu",
  },
  en: {
    center: "Notification center",
    allNotifs: "All notifications",
    noNotif: "No notification",
    noNotifAdminDesc: "No notification has been generated in the system yet.",
    read: "Read",
    unread: "Unread",
    notifs: "Notifications",
    unreadCount: (n: number) => `${n} unread`,
    markAll: "Mark all as read",
    noNotifUserDesc:
      "You have no notifications at the moment. Alerts and updates will appear here.",
    markRead: "Mark as read",
  },
};

const TYPE_STYLES: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
  NOUVEAU_RENDEZ_VOUS: {
    bg: "bg-sky-500/10",
    icon: <CalendarPlus className="w-4 h-4 text-sky-500" />,
  },
  RENDEZ_VOUS_CONFIRME: {
    bg: "bg-emerald-500/10",
    icon: <CalendarCheck className="w-4 h-4 text-emerald-500" />,
  },
  RENDEZ_VOUS_ANNULE: {
    bg: "bg-rose-500/10",
    icon: <CalendarX className="w-4 h-4 text-rose-500" />,
  },
  RENDEZ_VOUS_MODIFIE: {
    bg: "bg-amber-500/10",
    icon: <CalendarClock className="w-4 h-4 text-amber-500" />,
  },
  PAIEMENT_RECU: {
    bg: "bg-violet-500/10",
    icon: <Banknote className="w-4 h-4 text-violet-500" />,
  },
  INFO: {
    bg: "bg-slate-100 dark:bg-slate-800",
    icon: <Info className="w-4 h-4 text-slate-500" />,
  },
  STOCK_BAS: {
    bg: "bg-orange-500/10",
    icon: <PackageMinus className="w-4 h-4 text-orange-500" />,
  },
  MEDICAMENT_EXPIRE: {
    bg: "bg-red-500/10",
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
  },
  DISPENSATION: {
    bg: "bg-sky-500/10",
    icon: <Pill className="w-4 h-4 text-sky-500" />,
  },
};

const NotificationsPage = async () => {
  const isAdmin = await checkRole("ADMIN");
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;

  if (isAdmin) {
    const { data: notifications, total } = await getAllNotificationsAdmin();

    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                {t.center}
              </p>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {t.allNotifs}
                {total > 0 && (
                  <span className="ml-2 text-sm font-medium text-slate-400">
                    ({total})
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.noNotif}
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                {t.noNotifAdminDesc}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[hsl(196,22%,17%)]">
              {notifications.map((notif) => {
                const style = TYPE_STYLES[notif.type];
                const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                });

                return (
                  <li
                    key={notif.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-[hsl(196,24%,13%)] transition-colors"
                  >
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                      {style.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {notif.message}
                      </p>

                      {/* Sender → Recipient */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {notif.senderName && (
                          <>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                              <User className="w-3 h-3" />
                              {notif.senderName}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          </>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                          <User className="w-3 h-3" />
                          {notif.recipientName}
                        </span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo}</span>
                      </div>
                    </div>

                    {/* Read status badge */}
                    <span className={`flex-shrink-0 mt-1 text-xs px-2 py-0.5 rounded-full ${
                      notif.read
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        : "bg-sky-50 dark:bg-sky-950/30 text-sky-500"
                    }`}>
                      {notif.read ? t.read : t.unread}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ── Vue normale (patient / médecin) ──────────────────────────────────────────

  const { data: notifications, unreadCount } = await getNotifications();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                {t.center}
              </p>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {t.notifs}
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-medium text-sky-500">
                    ({t.unreadCount(unreadCount)})
                  </span>
                )}
              </h1>
            </div>
          </div>

          {unreadCount > 0 && (
            <form action={markAllAsRead}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400
                           hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                {t.markAll}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.noNotif}
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              {t.noNotifUserDesc}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-[hsl(196,22%,17%)]">
            {notifications.map((notif) => {
              const style = TYPE_STYLES[notif.type];
              const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                addSuffix: true,
                locale: dateLocale,
              });

              return (
                <li
                  key={notif.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors
                    ${!notif.read ? "bg-sky-50/50 dark:bg-sky-950/20" : "hover:bg-slate-50 dark:hover:bg-[hsl(196,24%,13%)]"}`}
                >
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                    {style.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {timeAgo}
                    </p>
                  </div>

                  {!notif.read && (
                    <form action={markAsRead.bind(null, notif.id)}>
                      <button
                        type="submit"
                        className="flex-shrink-0 text-xs text-slate-400 hover:text-sky-500 transition-colors mt-1"
                        title={t.markRead}
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
