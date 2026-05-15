import { cn } from "@/lib/utils";
import { AppointmentStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "En attente",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
    dot: "bg-amber-400",
  },
  SCHEDULED: {
    label: "Planifié",
    className:
      "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-800",
    dot: "bg-sky-500",
  },
  CANCELLED: {
    label: "Annulé",
    className:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800",
    dot: "bg-rose-500",
  },
  COMPLETED: {
    label: "Terminé",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
    dot: "bg-emerald-500",
  },
};

export const AppointmentStatusIndicator = ({
  status,
}: {
  status: AppointmentStatus;
}) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
      {config.label}
    </span>
  );
};
