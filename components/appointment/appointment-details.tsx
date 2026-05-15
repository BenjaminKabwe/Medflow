import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SmallCard } from "../small-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AppointmentDetailsProps {
  id: number | string;
  patient_id: string;
  appointment_date: Date;
  time: string;
  notes?: string;
}

export const AppointmentDetails = ({
  id,
  patient_id,
  appointment_date,
  time,
  notes,
}: AppointmentDetailsProps) => {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Informations du rendez-vous</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex">
          <SmallCard label="Rendez-vous n°" value={`# ${id}`} />
          <SmallCard
            label="Date"
            value={format(appointment_date, "d MMMM yyyy", { locale: fr })}
          />
          <SmallCard label="Heure" value={time} />
        </div>

        <div>
          <span className="text-sm font-medium">Notes supplémentaires</span>
          <p className="text-sm text-gray-500">{notes || "Aucune note"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
