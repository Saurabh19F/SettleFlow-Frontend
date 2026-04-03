export default function Badge({ children, tone = "indigo" }) {
  const tones = {
    indigo: "border border-indigo-500/30 bg-indigo-500/15 text-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.08)]",
    emerald: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]",
    amber: "border border-amber-500/30 bg-amber-500/15 text-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.08)]",
    rose: "border border-rose-500/30 bg-rose-500/15 text-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,0.08)]",
    slate: "border border-slate-500/25 bg-slate-500/15 text-slate-600 dark:text-slate-200"
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${tones[tone] || tones.slate}`}>{children}</span>;
}
