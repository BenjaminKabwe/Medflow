"use client";

import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Lang, translations, Translations } from "@/lib/i18n";

/* ─────────────────────────── Language Context ─────────────────────────── */

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
});

export const useLanguage = () => useContext(LanguageContext);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("fr");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("medflow_lang") as Lang | null;
    if (stored === "fr" || stored === "en") setLangState(stored);
  }, []);

  // Sync <html lang> attribute and cookie whenever language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.cookie = `medflow_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("medflow_lang", l);
    // Set the cookie synchronously so a server refresh picks up the new value.
    document.cookie = `medflow_lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(l);
    // Re-render the server component tree so any server-side translated
    // content updates too (not just the client components using `t`).
    router.refresh();
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

/* ─────────────────────────── Root Providers ─────────────────────────── */

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
};
