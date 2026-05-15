import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/utils";

interface CardProps {
  title: string;
  icon: LucideIcon;
  note: string;
  value: number;
  className?: string;
  iconClassName?: string;
  link: string;
}

export const StatCard = ({
  title,
  icon: Icon,
  note,
  value,
  className,
  iconClassName,
  link,
}: CardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 flex flex-col gap-3",
        "border border-slate-100 dark:border-slate-800",
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconClassName)}>
          <Icon className="w-5 h-5" />
        </div>
        {link && (
          <Link
            href={link}
            className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-sky-500 font-medium transition-colors"
          >
            Voir →
          </Link>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight">
        {formatNumber(value ?? 0)}
      </p>

      {/* Labels */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{note}</p>
      </div>
    </div>
  );
};
