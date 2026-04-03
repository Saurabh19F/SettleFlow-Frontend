import GlassCard from "./GlassCard";

const toneMap = {
  indigo: "text-indigo-500",
  rose: "text-rose-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
  slate: "text-slate-700 dark:text-slate-100"
};

export default function MetricCard({ title, value, hint, tone = "indigo" }) {
  return (
    <GlassCard>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">{title}</p>
      <p className={`mt-2 text-2xl font-semibold leading-none ${toneMap[tone] || toneMap.indigo}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{hint}</p> : null}
    </GlassCard>
  );
}
