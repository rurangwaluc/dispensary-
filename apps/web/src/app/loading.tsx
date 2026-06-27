export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="h-28 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="h-32 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-32 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-32 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-32 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    </main>
  );
}
