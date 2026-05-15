"use client";

import { AppointmentsChartProps } from "@/types/data-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "../providers";

interface DataProps {
  data: AppointmentsChartProps;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-card-md px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
          <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name} :</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const AppointmentChart = ({ data }: DataProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t.charts.appointmentsTitle}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.charts.appointmentsSubtitle} — {new Date().getFullYear()}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={14}
            barGap={4}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="rgba(148,163,184,0.15)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            <Legend
              align="right"
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: "12px",
                fontSize: "12px",
                color: "#94a3b8",
              }}
            />
            <Bar dataKey="appointment" name={t.charts.barAppointment} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed"   name={t.charts.barCompleted}   fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
