"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(pathname + "?" + createQueryString("q", searchValue));
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl
                      bg-slate-100 dark:bg-slate-800
                      border border-slate-200 dark:border-slate-700
                      focus-within:border-sky-400 dark:focus-within:border-sky-500
                      focus-within:ring-2 focus-within:ring-sky-400/20
                      transition-all duration-150">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <input
          className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200
                     placeholder:text-slate-400 dark:placeholder:text-slate-500 w-40"
          placeholder="Rechercher..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
    </form>
  );
};

export default SearchInput;
