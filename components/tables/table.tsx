import React from "react";

interface TableProps {
  columns: { header: string; key: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
}

export const Table = ({ columns, renderRow, data }: TableProps) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-slate-100 dark:border-slate-800">
          {columns.map(({ header, key, className }) => (
            <th
              key={key}
              className={`pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${className ?? ""}`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data?.length < 1 && (
          <tr>
            <td
              colSpan={columns.length}
              className="py-12 text-center text-sm text-slate-400 dark:text-slate-500"
            >
              Aucune donnée disponible
            </td>
          </tr>
        )}
        {data?.length > 0 && data.map((item, id) => renderRow({ ...item, index: id }))}
      </tbody>
    </table>
  );
};
