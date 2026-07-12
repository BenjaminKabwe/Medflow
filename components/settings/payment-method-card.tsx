"use client";

import { useOptimistic, useTransition } from "react";
import {
  Banknote,
  Building2,
  CreditCard,
  Shield,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { togglePaymentMethod } from "@/app/actions/payment-methods";
import { PaymentMethodDialog } from "./payment-method-dialog";
import type { PaymentMethodConfigRow } from "@/types";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: { fees: (n: number) => `${n}% frais`, deactivate: "Désactiver", activate: "Activer" },
  en: { fees: (n: number) => `${n}% fees`, deactivate: "Deactivate", activate: "Activate" },
};

// ─── Icon resolution ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Banknote,
  Building2,
  CreditCard,
  Shield,
  Smartphone,
};

function resolveIcon(name: string | null): LucideIcon {
  if (name && name in ICON_MAP) return ICON_MAP[name];
  return CreditCard;
}

// ─── Per-method colour tokens ─────────────────────────────────────────────────

const METHOD_STYLE: Record<
  string,
  { iconColor: string; iconBg: string; switchClass: string }
> = {
  CASH: {
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    switchClass: "data-[state=checked]:bg-emerald-500",
  },
  CARD: {
    iconColor: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
    switchClass: "data-[state=checked]:bg-sky-500",
  },
  MOBILE_MONEY: {
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-950/50",
    switchClass: "data-[state=checked]:bg-orange-500",
  },
  INSURANCE: {
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-50 dark:bg-violet-950/50",
    switchClass: "data-[state=checked]:bg-violet-500",
  },
  BANK_TRANSFER: {
    iconColor: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-800/50",
    switchClass: "data-[state=checked]:bg-slate-600",
  },
};

const getStyle = (method: string) => METHOD_STYLE[method] ?? METHOD_STYLE.CARD;

// ─── Component ────────────────────────────────────────────────────────────────

interface PaymentMethodCardProps {
  config: PaymentMethodConfigRow;
}

export function PaymentMethodCard({ config }: PaymentMethodCardProps) {
  const { lang } = useLanguage();
  const t = STR[lang];
  const Icon = resolveIcon(config.icon);
  const style = getStyle(config.method);

  const [, startTransition] = useTransition();
  const [optimisticIsActive, setOptimisticIsActive] = useOptimistic(
    config.isActive
  );

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      setOptimisticIsActive(checked);
      // togglePaymentMethod expects PaymentMethod enum — cast post-migration
      const result = await togglePaymentMethod(config.method as never, checked);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
        optimisticIsActive
          ? "border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60"
          : "border-slate-100 dark:border-slate-800/40 bg-slate-50/60 dark:bg-slate-900/20 opacity-60"
      }`}
    >
      {/* Icon badge */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}
      >
        <Icon className={`w-5 h-5 ${style.iconColor}`} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {config.label}
          </span>
          <span className="inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-wide">
            {config.method}
          </span>
          {config.fees > 0 && (
            <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {t.fees(config.fees)}
            </span>
          )}
        </div>
        {config.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {config.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Switch
          checked={optimisticIsActive}
          onCheckedChange={handleToggle}
          className={style.switchClass}
          aria-label={`${optimisticIsActive ? t.deactivate : t.activate} ${config.label}`}
        />
        <PaymentMethodDialog config={config} />
      </div>
    </div>
  );
}
