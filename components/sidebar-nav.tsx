"use client";

import {
  Activity,
  AlertTriangle,
  BellRing,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  FileHeart,
  FlaskConical,
  HeartHandshake,
  LayoutGrid,
  LayoutList,
  LayoutDashboard,
  LucideIcon,
  Pill,
  ScrollText,
  SlidersHorizontal,
  Stethoscope,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useLanguage } from "./providers";
import { SidebarLink } from "./sidebar-link";
import { LogoutButton } from "./logout-button";
import Link from "next/link";
import { Translations } from "@/lib/i18n";
import { useSidebarContext } from "./sidebar-context";
import { cn } from "@/lib/utils";

interface SidebarNavLink {
  nameKey: keyof Translations["nav"];
  href: string;
  access: string[];
  icon: LucideIcon;
  exact?: boolean;
}

interface SidebarSection {
  labelKey: keyof Translations["sections"];
  links: SidebarNavLink[];
}

const ACCESS_ALL = ["admin", "doctor", "nurse", "lab_technician", "patient"];

const SIDEBAR_CONFIG: SidebarSection[] = [
  {
    labelKey: "principal",
    links: [
      { nameKey: "dashboard", href: "",              access: ACCESS_ALL,   icon: LayoutGrid,       exact: true },
      { nameKey: "myProfile", href: "/patient/self", access: ["patient"],  icon: CircleUserRound,  exact: true },
    ],
  },
  {
    labelKey: "management",
    links: [
      { nameKey: "users",          href: "/record/users",                access: ["admin"],                         icon: Users },
      { nameKey: "doctors",        href: "/record/doctors",              access: ["admin"],                         icon: Stethoscope },
      { nameKey: "staffs",         href: "/record/staffs",               access: ["admin", "doctor"],               icon: UserCog },
      { nameKey: "patients",       href: "/record/patients",             access: ["admin", "doctor", "nurse"],      icon: HeartHandshake },
      { nameKey: "appointments",   href: "/record/appointments",         access: ["admin", "doctor", "nurse", "patient"], icon: CalendarDays },
      { nameKey: "medicalRecords", href: "/record/medical-records",      access: ["admin", "doctor", "nurse"],      icon: FileHeart },
      { nameKey: "billing",        href: "/record/billing",              access: ["admin", "doctor"],               icon: CreditCard },
      { nameKey: "patientMgmt",   href: "/nurse/patient-management",    access: ["nurse"],                         icon: UsersRound },
      { nameKey: "medications",    href: "/nurse/administer-medications", access: ["admin", "doctor", "nurse"],     icon: FlaskConical },
      { nameKey: "prescription",   href: "/patient/prescription",        access: ["patient"],                       icon: FlaskConical, exact: true },
      { nameKey: "myPayments",       href: "/patient/self?cat=payments",   access: ["patient"],           icon: CreditCard, exact: true },
      { nameKey: "cashierDashboard", href: "/cashier/dashboard",           access: ["cashier"],           icon: Wallet },
    ],
  },
  {
    labelKey: "pharmacy",
    links: [
      { nameKey: "pharmacy",              href: "/pharmacy",              access: ["admin", "pharmacist", "doctor", "nurse"], icon: LayoutDashboard, exact: true },
      { nameKey: "pharmacyCatalog",       href: "/pharmacy/medications",  access: ["admin", "pharmacist", "doctor"],          icon: Pill },
      { nameKey: "pharmacyInventory",     href: "/pharmacy/inventory",    access: ["admin", "pharmacist"],                    icon: Boxes },
      { nameKey: "pharmacyPrescriptions", href: "/pharmacy/prescriptions", access: ["admin", "pharmacist"],                    icon: ScrollText },
      { nameKey: "pharmacyDispensation",  href: "/pharmacy/dispensation", access: ["admin", "pharmacist", "nurse"],           icon: FlaskConical },
      { nameKey: "pharmacySuppliers",     href: "/pharmacy/suppliers",    access: ["admin", "pharmacist"],                    icon: Truck },
      { nameKey: "pharmacyPurchaseOrders", href: "/pharmacy/purchase-orders", access: ["admin", "pharmacist"],                 icon: ClipboardList },
      { nameKey: "pharmacyAlerts",        href: "/pharmacy/alerts",       access: ["admin", "pharmacist"],                    icon: AlertTriangle },
    ],
  },
  {
    labelKey: "laboratory",
    links: [
      { nameKey: "labQueue", href: "/lab/tests", access: ["admin", "lab_technician"], icon: FlaskConical },
    ],
  },
  {
    labelKey: "system",
    links: [
      { nameKey: "notifications", href: "/notifications",         access: ACCESS_ALL, icon: BellRing,          exact: true },
      { nameKey: "auditLogs",        href: "/admin/audit-logs",         access: ["admin"],  icon: ScrollText },
      { nameKey: "cashierSessions", href: "/admin/cashier-sessions",  access: ["admin"],  icon: LayoutList },
      { nameKey: "settings",        href: "/admin/system-settings",   access: ["admin"],  icon: SlidersHorizontal },
    ],
  },
];

interface SidebarNavProps {
  role: string;
}

export const SidebarNav = ({ role }: SidebarNavProps) => {
  const { t, lang } = useLanguage();
  const { collapsed, toggleCollapsed } = useSidebarContext();

  const visibleSections = SIDEBAR_CONFIG.map((section) => ({
    ...section,
    links: section.links.filter((link) =>
      link.access.includes(role.toLowerCase())
    ),
  })).filter((section) => section.links.length > 0);

  return (
    <div className="w-full h-full flex flex-col bg-[hsl(var(--sidebar-bg))] border-r border-slate-200 dark:border-white/[0.06] relative">
      {/* Signature petrol glow at the top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(199_89%_48%_/_0.10),transparent_70%)]" />

      {/* Logo + collapse toggle */}
      <div className={cn(
        "flex-shrink-0 flex items-center border-b border-slate-200 dark:border-white/[0.06] h-14 relative",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {collapsed ? (
          <Link href={`/${role}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-900/40 ring-1 ring-white/10">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </Link>
        ) : (
          <Link href={`/${role}`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-900/40 ring-1 ring-white/10">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-heading font-bold text-slate-900 dark:text-white tracking-tight">MedFlow</span>
          </Link>
        )}

        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md
                     text-slate-400 hover:text-slate-700 hover:bg-slate-100
                     dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          aria-label={
            collapsed
              ? lang === "en" ? "Expand" : "Déplier"
              : lang === "en" ? "Collapse" : "Replier"
          }
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {visibleSections.map((section) => (
          <div key={section.labelKey}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/35">
                {t.sections[section.labelKey]}
              </p>
            )}
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const href = link.nameKey === "dashboard" ? `/${role}` : link.href;
                return (
                  <SidebarLink
                    key={link.nameKey}
                    href={href}
                    name={t.nav[link.nameKey]}
                    icon={link.icon}
                    collapsed={collapsed}
                    exact={link.exact}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className={cn(
        "py-4 border-t border-slate-200 dark:border-white/[0.06]",
        collapsed ? "px-1 flex justify-center" : "px-3"
      )}>
        <LogoutButton collapsed={collapsed} />
      </div>
    </div>
  );
};
