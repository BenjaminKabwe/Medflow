import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const LINKS = [
  {
    href: "?cat=services",
    label: "Services",
    className: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    href: "?cat=payment",
    label: "Modes de paiement",
    className: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    href: "?cat=medical-history",
    label: "Historique médical",
    className: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
];

export const SettingsQuickLinks = () => {
  return (
    <Card className="w-full rounded-xl bg-white dark:bg-slate-900 shadow-none border border-slate-100 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-gray-500">Liens rapides</CardTitle>
      </CardHeader>
      <CardContent className="text-sm font-normal flex flex-wrap gap-4">
        {LINKS.map(({ href, label, className }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg transition-opacity hover:opacity-80 ${className}`}
          >
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
