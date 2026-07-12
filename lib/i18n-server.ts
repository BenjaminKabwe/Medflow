import { cookies } from "next/headers";
import { translations, type Lang, type Translations } from "@/lib/i18n";

/**
 * Reads the active language from the `medflow_lang` cookie (set by the
 * client LanguageProvider). Use this in Server Components / Server Actions,
 * where React context (useLanguage) is not available.
 *
 * Usage in a server component:
 *   import { getLang } from "@/lib/i18n-server";
 *   const T = { fr: { title: "Bonjour" }, en: { title: "Hello" } } as const;
 *   const t = T[await getLang()];
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("medflow_lang")?.value === "en" ? "en" : "fr";
}

/** Returns the core translation dictionary for the active language. */
export async function getT(): Promise<Translations> {
  return translations[await getLang()];
}
