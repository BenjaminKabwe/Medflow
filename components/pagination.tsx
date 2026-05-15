"use client";

import React, { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

interface PaginationProps {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export const Pagination = ({
  totalPages,
  currentPage,
  totalRecords,
  limit,
}: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      router.push(
        pathname + "?" + createQueryString("p", (currentPage - 1).toString())
      );
      // router.push(`?p=${currentPage - 1}`);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      // router.push(`?p=${currentPage + 1}`);
      router.push(
        pathname + "?" + createQueryString("p", (currentPage + 1).toString())
      );
    }
  };

  if (totalRecords === 0) return null;

  const start = currentPage * limit - (limit - 1);
  const end = currentPage * limit <= totalRecords ? currentPage * limit : totalRecords;

  return (
    <div className="p-4 flex items-center justify-between mt-5">
      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === 1}
        onClick={handlePrevious}
        className="py-2 px-4 rounded-md text-sm font-semibold
                   bg-slate-100 dark:bg-slate-800
                   text-slate-700 dark:text-slate-200
                   border-slate-200 dark:border-slate-700
                   hover:bg-slate-200 dark:hover:bg-slate-700
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        Précédent
      </Button>

      <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
        {start}–{end} sur {totalRecords}
      </span>

      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={handleNext}
        className="py-2 px-4 rounded-md text-sm font-semibold
                   bg-slate-100 dark:bg-slate-800
                   text-slate-700 dark:text-slate-200
                   border-slate-200 dark:border-slate-700
                   hover:bg-slate-200 dark:hover:bg-slate-700
                   disabled:cursor-not-allowed disabled:opacity-40"
      >
        Suivant
      </Button>
    </div>
  );
};
