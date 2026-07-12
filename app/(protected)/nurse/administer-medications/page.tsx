import { ViewAction } from "@/components/action-options";
import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { SearchParamsProps } from "@/types";
import { getMedications } from "@/utils/services/medications";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Pill, Stethoscope, Calendar } from "lucide-react";
import { getLang } from "@/lib/i18n-server";

const STR = {
  fr: {
    title: "Administration",
    prescriptions: (n: number) => `prescription${n !== 1 ? "s" : ""}`,
    male: "Homme",
    female: "Femme",
    prescribedMeds: "Médicaments prescrits",
    empty: "Aucune prescription trouvée.",
  },
  en: {
    title: "Administration",
    prescriptions: (n: number) => `prescription${n !== 1 ? "s" : ""}`,
    male: "Male",
    female: "Female",
    prescribedMeds: "Prescribed medications",
    empty: "No prescription found.",
  },
};

const DATA_LIMIT = 10;

const parseMedications = (text: string): string[] =>
  text
    .split(/\s*-\s+/)
    .map((m) => m.replace(/^-\s*/, "").trim())
    .filter(Boolean);

const AdministerMedicationsPage = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page        = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;
  const lang = await getLang();
  const t = STR[lang];
  const dateLocale = lang === "en" ? enUS : fr;

  const { data, totalPages, totalRecords, currentPage } = await getMedications({
    page,
    search: searchQuery,
    limit: DATA_LIMIT,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Pill className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
              {t.title}
            </p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalRecords}{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {t.prescriptions(totalRecords)}
              </span>
            </p>
          </div>
        </div>
        <SearchInput />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.map((item) => {
          const name = `${item.patient.first_name} ${item.patient.last_name}`;
          const meds = parseMedications(item.prescribed_medications ?? "");

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col gap-4"
            >
              {/* Top row: patient + action */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProfileImage
                    url={item.patient.img!}
                    name={name}
                    bgColor={item.patient.colorCode!}
                    textClassName="text-white"
                  />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                      {name.toLowerCase()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.patient.gender === "MALE" ? t.male : t.female}
                    </p>
                  </div>
                </div>
                <ViewAction
                  href={`/record/appointments/${item.medical.appointment_id}`}
                />
              </div>

              {/* Medications */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  {t.prescribedMeds}
                </p>
                <div className="flex flex-wrap gap-2">
                  {meds.length > 0 ? (
                    meds.map((med, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-medium leading-snug"
                      >
                        <Pill className="w-3 h-3 shrink-0" />
                        {med}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </div>
              </div>

              {/* Footer: doctor + date */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span className="font-medium">{item.doctor.name}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{item.doctor.specialization}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(item.created_at), "dd MMM yyyy", { locale: dateLocale })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          {t.empty}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalRecords={totalRecords}
          limit={DATA_LIMIT}
        />
      )}
    </div>
  );
};

export default AdministerMedicationsPage;
