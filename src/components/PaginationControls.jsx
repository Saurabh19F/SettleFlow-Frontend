export default function PaginationControls({ page, totalPages, fromRow, toRow, totalRows, onPrev, onNext }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
      <p className="text-slate-500 dark:text-slate-300">
        Showing {fromRow}-{toRow} of {totalRows}
      </p>
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/30 p-1 dark:bg-slate-900/40">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-full bg-slate-500/15 px-3 py-1 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
        >
          Prev
        </button>
        <span className="px-1 text-slate-500 dark:text-slate-300">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
