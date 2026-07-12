"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useLanguage } from "./providers";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

const LANGUAGES: { code: Lang; label: string; country: string; flag: string }[] = [
  { code: "fr", label: "Français", country: "France", flag: "🇫🇷" },
  { code: "en", label: "English", country: "United Kingdom", flag: "🇬🇧" },
];

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Changer de langue / Switch language"
        aria-label="Changer de langue"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg
                  bg-slate-100 hover:bg-slate-200
                  dark:bg-slate-800 dark:hover:bg-slate-700
                  text-slate-500 dark:text-slate-400
                  transition-all duration-200"
      >
        <Globe className="w-4 h-4" />
        {/* Current flag badge */}
        <span className="absolute -bottom-1 -right-1 text-[10px] leading-none drop-shadow-sm">
          {current.flag}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 z-50 overflow-hidden rounded-xl
                    border border-slate-200 dark:border-slate-800
                    bg-white dark:bg-slate-900 shadow-lg animate-fade-in"
        >
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Langue / Language
          </p>
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-medium">{l.label}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {l.country}
                  </span>
                </span>
                {active && (
                  <Check className="w-4 h-4 ml-auto text-sky-600 dark:text-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
