import { Table } from "@/components/tables/table";
import { clerkClient } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { Users } from "lucide-react";
import React from "react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    colId: "ID Utilisateur",
    colName: "Nom",
    colEmail: "Email",
    colRole: "Rôle",
    colStatus: "Statut",
    colLastLogin: "Dernière connexion",
    active: "Actif",
    title: "Utilisateurs",
    registered: "enregistrés",
    roles: {
      admin: "Administrateur",
      doctor: "Médecin",
      nurse: "Infirmier(ère)",
      patient: "Patient",
      "lab technician": "Technicien de labo",
    } as Record<string, string>,
  },
  en: {
    colId: "User ID",
    colName: "Name",
    colEmail: "Email",
    colRole: "Role",
    colStatus: "Status",
    colLastLogin: "Last login",
    active: "Active",
    title: "Users",
    registered: "registered",
    roles: {
      admin: "Administrator",
      doctor: "Doctor",
      nurse: "Nurse",
      patient: "Patient",
      "lab technician": "Lab technician",
    } as Record<string, string>,
  },
};

interface UserProps {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: { emailAddress: string }[];
  publicMetadata: { role: string };
  lastSignInAt: number | string;
}

const UserPage = async () => {
  const client = await clerkClient();
  const { data, totalCount } = await client.users.getUserList({ orderBy: "-created_at" });

  if (!data) return null;

  const t = STR[await getLang()];
  const columns = [
    { header: t.colId, key: "id", className: "hidden lg:table-cell" },
    { header: t.colName, key: "name" },
    { header: t.colEmail, key: "email", className: "hidden md:table-cell" },
    { header: t.colRole, key: "role" },
    { header: t.colStatus, key: "status" },
    { header: t.colLastLogin, key: "last_login", className: "hidden xl:table-cell" },
  ];

  const renderRow = (item: UserProps) => {
    const role = (item?.publicMetadata?.role as string) || "";
    return (
      <tr key={item.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
        <td className="hidden lg:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 font-mono text-xs truncate max-w-[180px]">
          {item?.id}
        </td>
        <td className="py-3 pr-4 font-semibold text-slate-800 dark:text-slate-100">
          {item?.firstName} {item?.lastName}
        </td>
        <td className="hidden md:table-cell py-3 pr-4 text-slate-600 dark:text-slate-300 text-xs">
          {item?.emailAddresses[0]?.emailAddress}
        </td>
        <td className="py-3 pr-4">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 capitalize">
            {t.roles[role.toLowerCase()] ?? role}
          </span>
        </td>
        <td className="py-3 pr-4">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {t.active}
          </span>
        </td>
        <td className="hidden xl:table-cell py-3 pr-4 text-slate-500 dark:text-slate-400 text-xs">
          {item?.lastSignInAt
            ? format(new Date(item.lastSignInAt), "dd/MM/yyyy HH:mm")
            : "—"}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{t.title}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalCount}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">{t.registered}</span>
            </p>
          </div>
        </div>
      </div>

      <Table columns={columns} data={data} renderRow={renderRow} />
    </div>
  );
};

export default UserPage;
