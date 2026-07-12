"use client";

import { FaMagnifyingGlassChart } from "react-icons/fa6";
import { useLanguage } from "@/components/providers";

export const NoDataFound = ({ note }: { note?: string }) => {
  const { lang } = useLanguage();
  const fallback = lang === "en" ? "No result found" : "Aucun résultat trouvé";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-0">
      <FaMagnifyingGlassChart size={80} className="text-gray-600" />
      <span className="text-xl text-gray-500 mt-2 font-medium">
        {note || fallback}
      </span>
    </div>
  );
};
