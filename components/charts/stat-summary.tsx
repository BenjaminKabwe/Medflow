"use client";

import Link from "next/link";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/utils";
import { useLanguage } from "../providers";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface StatSummaryProps {
  data: any;
  total: number;
}

export const StatSummary = ({ data, total }: StatSummaryProps) => {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  const pending   = (data?.PENDING ?? 0) + (data?.SCHEDULED ?? 0);
  const completed = data?.COMPLETED ?? 0;
  const cancelled = data?.CANCELLED ?? 0;
  const sum       = pending + completed + cancelled;

  const pct = (n: number) => (sum > 0 ? ((n / sum) * 100).toFixed(0) : "0");

  const chartData = [
    { name: t.charts.cancelled, count: cancelled || 0.01, fill: "#f43f5e" },
    { name: t.charts.completed, count: completed || 0.01, fill: "#10b981" },
    { name: t.charts.pending,   count: pending   || 0.01, fill: "#0ea5e9" },
  ];

  const legend = [
    { color: "#0ea5e9", label: t.charts.pending,   count: pending,   pct: pct(pending) },
    { color: "#10b981", label: t.charts.completed,  count: completed, pct: pct(completed) },
    { color: "#f43f5e", label: t.charts.cancelled,  count: cancelled, pct: pct(cancelled) },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5 h-full flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.charts.summaryTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.charts.summarySubtitle}</p>
        </div>
        <Link
          href="/record/appointments"
          className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors"
        >
          {t.charts.details}
        </Link>
      </div>

      {/* Radial chart */}
      <div className="flex-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="38%"
            outerRadius="88%"
            barSize={12}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="count"
              background={{ fill: trackColor }}
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800 dark:text-white leading-none">
            {formatNumber(total ?? 0)}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-1">
            {t.charts.total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {legend.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl bg-slate-50 dark:bg-slate-800"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {formatNumber(item.count)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 text-center leading-tight">{item.label}</span>
            <span className="text-[10px] font-bold" style={{ color: item.color }}>
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
