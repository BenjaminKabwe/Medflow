"use client";

import {
  Activity, ArrowRight, Bell, Calendar, CheckCircle,
  ClipboardList, FileText, FolderOpen, Heart, LayoutDashboard,
  Pill, Search, Shield, ShieldCheck, Stethoscope, UserCheck,
  Users, Zap,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "./providers";

const BLUE_GRADIENT = "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)";
const HERO_GRADIENT = "linear-gradient(135deg, #0c4a6e 0%, #0369a1 52%, #0ea5e9 100%)";

const MOCK_PATIENTS = [
  { id: "#1042", name: "Jean Dupont",   age: "45 ans", doctor: "Dr. Martin",   status: "Actif",           dot: "bg-emerald-500", last: "Aujourd'hui" },
  { id: "#1041", name: "Marie Lambert", age: "67 ans", doctor: "Dr. Rousseau", status: "En consultation", dot: "bg-blue-500",    last: "En cours"    },
  { id: "#1040", name: "Pierre Moreau", age: "32 ans", doctor: "Dr. Martin",   status: "Planifié",        dot: "bg-amber-500",   last: "12/05/2026"  },
  { id: "#1039", name: "Sophie Chen",   age: "28 ans", doctor: "Dr. Dubois",   status: "Actif",           dot: "bg-emerald-500", last: "10/05/2026"  },
];

const SIDEBAR_NAV = [
  { icon: LayoutDashboard, label: "Dashboard",   active: false },
  { icon: Users,           label: "Patients",    active: true  },
  { icon: FolderOpen,      label: "Dossiers",    active: false },
  { icon: Pill,            label: "Ordonnances", active: false },
  { icon: Calendar,        label: "Agenda",      active: false },
];

/* Tailwind class strings so dark: variants are detected by the JIT scanner */
const FEATURE_CFG = {
  appt:     { accent: "#2563eb", iconColor: "text-blue-600 dark:text-blue-400",    iconBg: "bg-blue-50 dark:bg-blue-950/50",     border: "border-blue-200 dark:border-blue-900/50",    bar: "bg-blue-600"    },
  records:  { accent: "#0d9488", iconColor: "text-teal-600 dark:text-teal-400",    iconBg: "bg-teal-50 dark:bg-teal-950/50",     border: "border-teal-200 dark:border-teal-900/50",    bar: "bg-teal-600"    },
  roles:    { accent: "#7c3aed", iconColor: "text-violet-600 dark:text-violet-400",iconBg: "bg-violet-50 dark:bg-violet-950/50", border: "border-violet-200 dark:border-violet-900/50", bar: "bg-violet-600"  },
  security: { accent: "#dc2626", iconColor: "text-red-600 dark:text-red-400",      iconBg: "bg-red-50 dark:bg-red-950/50",       border: "border-red-200 dark:border-red-900/50",      bar: "bg-red-600"     },
} as const;

const FEATURE_ICONS: Record<string, React.ElementType> = {
  appt: Calendar, records: FileText, roles: UserCheck, security: ShieldCheck,
};

export const LandingContent = () => {
  const { t } = useLanguage();

  const features = [
    { key: "appt"     },
    { key: "records"  },
    { key: "roles"    },
    { key: "security" },
  ] as const;

  const stats = [
    { value: "2 847",       label: t.landing.stats.uptime     },
    { value: "RGPD",        label: t.landing.stats.compliance },
    { value: "Multi-rôles", label: t.landing.stats.access     },
    { value: "< 30s",       label: t.landing.stats.realtime   },
  ];

  const steps = [
    { num: 1, icon: Users,       title: "Créez votre espace",         desc: "Inscrivez votre établissement et configurez les rôles en quelques minutes." },
    { num: 2, icon: Stethoscope, title: "Invitez votre équipe",       desc: "Ajoutez médecins, infirmières et personnel avec leurs accès spécifiques."  },
    { num: 3, icon: Zap,         title: "Opérationnel immédiatement", desc: "Gérez rendez-vous, dossiers et facturation dès le premier jour."           },
  ];

  const roles = [
    { name: "Administrateur", color: "#7c3aed", border: "border-violet-200 dark:border-violet-900/50", perms: ["admin","write","read"], items: ["Gestion des utilisateurs","Rapports & analytics","Configuration système"] },
    { name: "Médecin",        color: "#2563eb", border: "border-blue-200 dark:border-blue-900/50",     perms: ["write","read"],          items: ["Dossiers médicaux","Prescriptions","Historique patient"]                 },
    { name: "Infirmière",     color: "#0d9488", border: "border-teal-200 dark:border-teal-900/50",     perms: ["write","read"],          items: ["Suivi des patients","Administration médicaments","Notes de soins"]       },
    { name: "Patient",        color: "#ea580c", border: "border-orange-200 dark:border-orange-900/50", perms: ["read"],                  items: ["Mes rendez-vous","Ordonnances","Mes paiements"]                          },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* ════════════════════════════════
          NAVBAR
      ════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-3.5 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200" style={{ background: BLUE_GRADIENT }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-white font-heading">MedFlow</span>
              <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium tracking-[0.14em] uppercase">EHR System</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { label: "Fonctionnalités", href: "#features" },
              { label: "Rôles",           href: "#roles"    },
              { label: "Sécurité",        href: "#security" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="px-3.5 py-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
            <Link href="/sign-in" className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150">
              {t.landing.signIn}
            </Link>
            <Link href="/sign-up" className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm hover:shadow-blue-300/50 hover:scale-[1.02] transition-all duration-200" style={{ background: BLUE_GRADIENT }}>
              {t.landing.newPatient}
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-30 dark:opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-400/6 dark:bg-blue-500/8 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-sky-400/5 dark:bg-sky-500/6 blur-[90px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-20 items-center">

          {/* ── Left: copy ── */}
          <div className="flex flex-col">

            {/* Badge */}
            <div
              className="inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-8 animate-fade-in-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {t.landing.badge}
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              <span className="block text-4xl md:text-5xl lg:text-[3.25rem] font-heading font-light text-slate-900 dark:text-white leading-[1.1] tracking-[-0.025em]">
                {t.landing.heroTitle1}
              </span>
              <span
                className="block text-4xl md:text-5xl lg:text-[3.25rem] font-heading font-bold leading-[1.1] tracking-[-0.025em] mt-1"
                style={{ background: HERO_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                {t.landing.heroTitle2}
              </span>
            </h1>

            <p
              className="mt-6 text-base text-slate-500 dark:text-slate-400 max-w-[440px] leading-[1.8] animate-fade-in-up"
              style={{ animationDelay: "160ms" }}
            >
              {t.landing.heroDesc}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-blue-950 hover:shadow-blue-300 dark:hover:shadow-blue-900 hover:scale-[1.02] transition-all duration-200"
                style={{ background: BLUE_GRADIENT }}
              >
                <Stethoscope className="w-4 h-4" />
                {t.landing.cta1}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                {t.landing.cta2}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-9 flex flex-wrap items-center gap-5 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
              {[
                { icon: ShieldCheck, label: "RGPD conforme", cls: "text-emerald-600 dark:text-emerald-400" },
                { icon: Shield,      label: "HDS certifié",  cls: "text-blue-600 dark:text-blue-400"       },
                { icon: CheckCircle, label: "ISO 27001",     cls: "text-sky-600 dark:text-sky-400"       },
              ].map(({ icon: Icon, label, cls }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cls}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: EHR mock ── */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-400/10 via-sky-400/5 to-sky-400/8 dark:from-blue-500/10 dark:via-sky-500/5 dark:to-sky-500/8 blur-2xl pointer-events-none" />

            {/* Browser frame */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/80 overflow-hidden bg-white dark:bg-slate-900">

              {/* Chrome bar */}
              <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 px-2.5 py-1 flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BLUE_GRADIENT }} />
                  <span className="text-[9.5px] text-slate-400 truncate">app.medflow.fr/patients</span>
                </div>
                <Bell className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </div>

              {/* App layout */}
              <div className="flex" style={{ height: "360px" }}>

                {/* Sidebar — always dark navy */}
                <div className="w-40 flex-shrink-0 bg-slate-900 flex flex-col py-3">
                  <div className="px-3 pb-3 mb-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BLUE_GRADIENT }}>
                        <Activity className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[10.5px] font-bold text-white font-heading">MedFlow</span>
                    </div>
                  </div>
                  <div className="flex-1 px-2 space-y-0.5 overflow-hidden">
                    {SIDEBAR_NAV.map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium cursor-default select-none transition-colors ${active ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                        {active && <div className="ml-auto w-1 h-1 rounded-full bg-white/60 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <div className="px-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">DM</div>
                      <div className="min-w-0">
                        <div className="text-[9.5px] font-semibold text-white leading-none truncate">Dr. Martin</div>
                        <div className="text-[8px] text-slate-500 mt-0.5">Médecin</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main panel */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
                  {/* Toolbar */}
                  <div className="border-b border-slate-100 dark:border-slate-700/60 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-none font-heading">Patients</div>
                      <div className="text-[8.5px] text-slate-400 mt-0.5">2 847 dossiers actifs</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-600">
                        <Search className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                        <span className="text-[8.5px] text-slate-400">Rechercher...</span>
                      </div>
                      <button className="text-[8.5px] font-semibold text-white px-2.5 py-1.5 rounded-lg flex-shrink-0" style={{ background: BLUE_GRADIENT }}>
                        + Nouveau
                      </button>
                    </div>
                  </div>

                  {/* Table head */}
                  <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/60 grid grid-cols-5 gap-2 flex-shrink-0">
                    {["ID", "Patient", "Médecin", "Statut", "Visite"].map((col) => (
                      <div key={col} className="text-[7.5px] font-bold text-slate-400 uppercase tracking-[0.12em]">{col}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="flex-1 overflow-hidden">
                    {MOCK_PATIENTS.map((p, i) => (
                      <div
                        key={p.id}
                        className={`px-4 py-2.5 grid grid-cols-5 gap-2 border-b border-slate-50 dark:border-slate-800/60 items-center cursor-default ${i === 0 ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                      >
                        <div className="text-[8.5px] font-mono text-slate-400">{p.id}</div>
                        <div>
                          <div className="text-[9.5px] font-semibold text-slate-800 dark:text-slate-200 leading-none truncate">{p.name}</div>
                          <div className="text-[7.5px] text-slate-400 mt-0.5">{p.age}</div>
                        </div>
                        <div className="text-[8.5px] text-slate-500 dark:text-slate-400 truncate">{p.doctor}</div>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot}`} />
                          <span className="text-[7.5px] text-slate-600 dark:text-slate-400 truncate">{p.status}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-400 truncate">{p.last}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status bar */}
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[7.5px] text-slate-400">Système opérationnel</span>
                    </div>
                    <span className="text-[7.5px] text-slate-300 dark:text-slate-600">Page 1 / 237</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating metric cards */}
            <div className="absolute -bottom-5 -left-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-[11px] font-bold font-heading text-slate-900 dark:text-white leading-none">98.4%</div>
                <div className="text-[8px] text-slate-400 mt-0.5">Satisfaction</div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-[11px] font-bold font-heading text-slate-900 dark:text-white leading-none">2 847</div>
                <div className="text-[8px] text-slate-400 mt-0.5">Dossiers actifs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-wrap justify-around gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <span className="text-xl md:text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-tight leading-none">{s.value}</span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.16em] font-medium mt-1.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FEATURES
      ════════════════════════════════ */}
      <section id="features" className="py-24 px-6 md:px-10 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              <ClipboardList className="w-3 h-3" />
              Fonctionnalités clés
            </div>
            <h2 className="text-3xl md:text-[2.25rem] font-heading font-light text-slate-900 dark:text-white tracking-tight leading-tight">
              Tout ce dont vous avez besoin,{" "}
              <span className="font-bold" style={{ background: HERO_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                en un seul endroit
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ key }) => {
              const f    = t.landing.features[key];
              const c    = FEATURE_CFG[key];
              const Icon = FEATURE_ICONS[key];
              return (
                <div
                  key={key}
                  className={`group relative rounded-2xl p-6 bg-white dark:bg-slate-900 border ${c.border} hover:shadow-lg dark:hover:shadow-slate-950/60 hover:-translate-y-0.5 transition-all duration-300 cursor-default`}
                >
                  <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${c.bar}`} />
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 ${c.iconBg}`}>
                    <Icon className={`w-5 h-5 ${c.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 leading-snug font-heading">{f.title}</h3>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════ */}
      <section className="py-24 px-6 md:px-10 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/60 text-sky-700 dark:text-sky-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              <Zap className="w-3 h-3" />
              Démarrage rapide
            </div>
            <h2 className="text-3xl md:text-[2.25rem] font-heading font-light text-slate-900 dark:text-white tracking-tight leading-tight">
              Opérationnel en{" "}
              <span className="font-bold">3 étapes</span>
            </h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              De l'inscription à la première consultation — en moins d'une heure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="absolute top-[3.25rem] left-[24%] right-[24%] h-px hidden md:block pointer-events-none" style={{ background: "linear-gradient(90deg,#bfdbfe,#7dd3fc)" }} />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col items-center text-center group">
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 group-hover:border-blue-400 dark:group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-100 dark:group-hover:shadow-blue-950/50 transition-all duration-300 shadow-sm">
                    <Icon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: BLUE_GRADIENT }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 leading-snug font-heading">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          ROLES
      ════════════════════════════════ */}
      <section id="roles" className="py-24 px-6 md:px-10 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/60 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              <Users className="w-3 h-3" />
              Accès multi-rôles
            </div>
            <h2 className="text-3xl md:text-[2.25rem] font-heading font-light text-slate-900 dark:text-white tracking-tight leading-tight">
              Une plateforme,{" "}
              <span className="font-bold">tous les acteurs</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className={`group rounded-2xl p-5 border bg-white dark:bg-slate-900 ${role.border} hover:shadow-lg dark:hover:shadow-slate-950/60 hover:-translate-y-0.5 transition-all duration-300`}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold font-heading flex-shrink-0" style={{ backgroundColor: role.color }}>
                    {role.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold font-heading text-slate-900 dark:text-white leading-none truncate">{role.name}</div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {role.perms.map((p) => (
                        <span key={p} className="text-[7px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide" style={{ background: role.color + "20", color: role.color }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: role.color }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] font-medium">Accès configuré</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CTA
      ════════════════════════════════ */}
      <section id="security" className="py-24 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0ea5e9 100%)" }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-sky-400/15 blur-[70px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-[2.5rem] font-heading font-light text-white tracking-tight leading-tight mb-4">
            Prêt à transformer{" "}
            <span className="font-bold">votre établissement ?</span>
          </h2>
          <p className="text-white/60 text-base mb-10 max-w-md mx-auto leading-[1.75]">
            Rejoignez les équipes médicales qui ont digitalisé leur gestion avec MedFlow — sécurisé, conforme RGPD, disponible 24h/24.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-blue-700 font-bold font-heading text-sm shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-200"
            >
              <Stethoscope className="w-5 h-5" />
              {t.landing.cta1}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/25 bg-white/10 text-white font-semibold text-sm hover:border-white/40 hover:bg-white/15 transition-all duration-200"
            >
              {t.landing.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer className="bg-slate-900 dark:bg-[#06090f] border-t border-slate-800 pt-14 pb-8 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-12">

            <div className="flex flex-col gap-5 max-w-xs">
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200" style={{ background: BLUE_GRADIENT }}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold font-heading text-white tracking-tight">MedFlow</span>
              </Link>
              <p className="text-[12.5px] text-slate-500 leading-[1.7]">
                Système de gestion électronique des dossiers médicaux — conçu pour l'excellence clinique et la conformité RGPD.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { icon: Shield,      label: "RGPD",     cls: "text-emerald-400" },
                  { icon: ShieldCheck, label: "HDS",      cls: "text-blue-400"    },
                  { icon: CheckCircle, label: "ISO 27001", cls: "text-sky-400"   },
                ].map(({ icon: Icon, label, cls }) => (
                  <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800">
                    <Icon className={`w-3 h-3 ${cls}`} />
                    <span className="text-[9.5px] text-slate-400 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="text-slate-500 font-semibold mb-4 text-[10px] uppercase tracking-[0.2em]">Plateforme</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/sign-in" className="text-slate-500 hover:text-slate-300 transition-colors text-[12.5px]">{t.landing.signIn}</Link></li>
                  <li><Link href="/sign-up" className="text-slate-500 hover:text-slate-300 transition-colors text-[12.5px]">{t.landing.newPatient}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-500 font-semibold mb-4 text-[10px] uppercase tracking-[0.2em]">Rôles</h4>
                <ul className="space-y-2.5">
                  {["Médecin","Infirmière","Administrateur","Patient"].map((r) => (
                    <li key={r}><span className="text-slate-600 text-[12.5px]">{r}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-slate-500 font-semibold mb-4 text-[10px] uppercase tracking-[0.2em]">Conformité</h4>
                <ul className="space-y-2.5">
                  {["RGPD","HDS Certifié","Données chiffrées","99.9% uptime"].map((item) => (
                    <li key={item}><span className="text-slate-600 text-[12.5px]">{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-600">
              &copy; {new Date().getFullYear()} MedFlow — {t.landing.footer}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-600 uppercase tracking-[0.15em]">Tous systèmes opérationnels</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
