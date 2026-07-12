"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    title: "Fréquence cardiaque",
    lastMeasure: "Dernière mesure",
    average: "Fréquence moyenne",
    noData: "Aucune donnée disponible",
    value1: "Valeur 1",
    value2: "Valeur 2",
  },
  en: {
    title: "Heart rate",
    lastMeasure: "Last measurement",
    average: "Average rate",
    noData: "No data available",
    value1: "Value 1",
    value2: "Value 2",
  },
};

interface DataProps {
  average: string;
  data: {
    label: string;
    value1: number;
    value2: number;
  }[];
}

export function HeartRateChart({ average, data }: DataProps) {
  const { lang } = useLanguage();
  const t = STR[lang];
  const lastData = data[data.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg xl:text-xl font-semibold">
              {lastData?.value1 ?? 0}-{lastData?.value2 ?? 0} bpm
            </p>
            <p className="text-sm text-gray-500">{t.lastMeasure}</p>
          </div>
          <div>
            <p className="text-lg xl:text-xl font-semibold">{average}</p>
            <p className="text-sm text-gray-500">{t.average}</p>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            {t.noData}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#ddd"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tick={{ fill: "#9ca3af" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "#9ca3af" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "10px", borderColor: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value1"
                name={t.value1}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="value2"
                name={t.value2}
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
