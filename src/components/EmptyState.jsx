export default function EmptyState({ title, subtitle }) {
  return (
    <div className="glass rounded-2xl border border-dashed p-10 text-center">
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
    </div>
  );
}