export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-5 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-56 bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="h-14 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>

      {/* Sessions skeleton */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
