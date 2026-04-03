import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const toneMap = {
  slate: "text-slate-900 dark:text-slate-100",
  indigo: "text-indigo-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
  cyan: "text-cyan-500"
};

export default function StatCard({ label, value, trend, icon: Icon, valueTone = "slate", iconTone = "cyan" }) {
  return (
    <motion.div
      className="glass group relative overflow-hidden rounded-2xl p-4"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-500/10 blur-2xl transition duration-500 group-hover:scale-110" />
      <div className="flex items-start justify-between">
        <div className="relative z-[1]">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${toneMap[valueTone] || toneMap.slate}`}>{value}</p>
        </div>
        {Icon && (
          <div className="relative z-[1] rounded-xl border border-white/30 bg-white/40 p-2 dark:border-white/10 dark:bg-slate-800/60">
            <Icon className={`h-4 w-4 ${toneMap[iconTone] || toneMap.cyan}`} />
          </div>
        )}
      </div>
      {trend && (
        <div className="relative z-[1] mt-3 flex items-center gap-1 text-xs text-emerald-500">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {trend}
        </div>
      )}
    </motion.div>
  );
}
