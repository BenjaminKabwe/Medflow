"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    title: "Tension artérielle",
    lastMeasure: "Dernière mesure",
    avg7days: "Moyenne 7 jours",
    noData: "Aucune donnée disponible",
    systolic: "Systolique",
    diastolic: "Diastolique",
  },
  en: {
    title: "Blood pressure",
    lastMeasure: "Last measurement",
    avg7days: "7-day average",
    noData: "No data available",
    systolic: "Systolic",
    diastolic: "Diastolic",
  },
};

interface BloodPressureChartProps {
  average: string;
  data: {
    label: string;
    systolic: number;
    diastolic: number;
  }[];
}

const BloodPressureChart = ({ data, average }: BloodPressureChartProps) => {
  const { lang } = useLanguage();
  const t = STR[lang];
  const lastData = data[data.length - 1];

  return (
    <Card className="shadow-none col-span-2">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg xl:text-xl font-semibold">
              {lastData?.systolic ?? 0}/{lastData?.diastolic ?? 0} mmHg
            </p>
            <p className="text-sm text-muted-foreground">{t.lastMeasure}</p>
          </div>

          <div>
            <p className="text-lg xl:text-xl font-semibold">{average}</p>
            <p className="text-sm text-muted-foreground">{t.avg7days}</p>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            {t.noData}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#ddd"
              />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tick={{ fill: "#9ca3af" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "10px", borderColor: "#fff" }}
              />
              <Legend
                align="left"
                verticalAlign="top"
                wrapperStyle={{
                  paddingTop: "20px",
                  paddingBottom: "40px",
                  textTransform: "capitalize",
                }}
              />
              <Bar
                dataKey="systolic"
                name={t.systolic}
                fill="#000000"
                legendType="circle"
                radius={[10, 10, 0, 0]}
              />
              <Bar
                dataKey="diastolic"
                name={t.diastolic}
                fill="#2563eb"
                legendType="circle"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BloodPressureChart;
