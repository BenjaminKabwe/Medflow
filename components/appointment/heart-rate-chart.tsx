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

interface DataProps {
  average: string;
  data: {
    label: string;
    value1: number;
    value2: number;
  }[];
}

export function HeartRateChart({ average, data }: DataProps) {
  const lastData = data[data.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fréquence cardiaque</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg xl:text-xl font-semibold">
              {lastData?.value1 ?? 0}-{lastData?.value2 ?? 0} bpm
            </p>
            <p className="text-sm text-gray-500">Dernière mesure</p>
          </div>
          <div>
            <p className="text-lg xl:text-xl font-semibold">{average}</p>
            <p className="text-sm text-gray-500">Fréquence moyenne</p>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            Aucune donnée disponible
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
                name="Valeur 1"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="value2"
                name="Valeur 2"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
