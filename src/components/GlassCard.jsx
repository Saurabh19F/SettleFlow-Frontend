import { motion } from "framer-motion";

export default function GlassCard({ title, subtitle, action, children, className = "" }) {
  return (
    <motion.section
      className={`glass group relative overflow-hidden rounded-2xl p-5 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/15 to-cyan-500/5 blur-2xl transition duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      {(title || action) && (
        <div className="relative z-[1] mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.section>
  );
}
