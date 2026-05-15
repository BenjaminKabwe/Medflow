import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans, Inter, Instrument_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import type { Lang } from "@/lib/i18n";
import "./globals.css";

/* ── Fonts loaded locally via next/font — no external request at runtime ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MedFlow — Gestion électronique des dossiers patients",
    template: "%s | MedFlow",
  },
  description:
    "MedFlow est un système de gestion électronique des dossiers patients. Planifiez des rendez-vous, gérez les dossiers médicaux et pilotez votre établissement de santé.",
  keywords: ["médecin", "patient", "hôpital", "dossiers médicaux", "rendez-vous", "santé"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("medflow_lang")?.value;
  const lang: Lang = langCookie === "en" ? "en" : "fr";

  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang={lang}
        suppressHydrationWarning
        className={`${inter.variable} ${dmSans.variable} ${instrumentSerif.variable}`}
      >
        <body className="antialiased">
          <Providers>
            {children}
            <Toaster richColors position="top-center" />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
