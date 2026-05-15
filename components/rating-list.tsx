import { Star } from "lucide-react";
import React from "react";

export const RatingList = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
        Avis patients
      </h2>

      {data?.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {data.map((rate) => (
            <div
              key={rate?.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                  {`${rate?.patient?.first_name} ${rate?.patient?.last_name}`.toLowerCase()}
                </p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(rate?.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < rate.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">{rate.rating.toFixed(1)}</span>
              </div>
              {rate?.comment && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {rate.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
