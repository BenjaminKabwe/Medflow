"use client";

import { useLanguage } from "./providers";
import { cn } from "@/lib/utils";

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5
                bg-slate-100 dark:bg-slate-800"
      title="Changer de langue / Switch language"
    >
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
            lang === l
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
};
