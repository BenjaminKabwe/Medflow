import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { SmallCard } from "../small-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Informations du rendez-vous",
    apptNum: "Rendez-vous n°",
    date: "Date",
    time: "Heure",
    notes: "Notes supplémentaires",
    noNote: "Aucune note",
  },
  en: {
    title: "Appointment information",
    apptNum: "Appointment no.",
    date: "Date",
    time: "Time",
    notes: "Additional notes",
    noNote: "No note",
  },
};

interface AppointmentDetailsProps {
  id: number | string;
  patient_id: string;
  appointment_date: Date;
  time: string;
  notes?: string;
}

export const AppointmentDetails = async ({
  id,
  patient_id,
  appointment_date,
  time,
  notes,
}: AppointmentDetailsProps) => {
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex">
          <SmallCard label={t.apptNum} value={`# ${id}`} />
          <SmallCard
            label={t.date}
            value={format(appointment_date, "d MMMM yyyy", { locale: dateLocale })}
          />
          <SmallCard label={t.time} value={time} />
        </div>

        <div>
          <span className="text-sm font-medium">{t.notes}</span>
          <p className="text-sm text-gray-500">{notes || t.noNote}</p>
        </div>
      </CardContent>
    </Card>
  );
};
