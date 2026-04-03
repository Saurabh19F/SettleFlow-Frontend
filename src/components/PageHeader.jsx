import { motion } from "framer-motion";

export default function PageHeader({ title, description, action }) {
  return (
    <motion.div
      className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <div className="mb-2 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>}
      </div>
      {action ? <div className="w-full md:w-auto">{action}</div> : null}
    </motion.div>
  );
}
